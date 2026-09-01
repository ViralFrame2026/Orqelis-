import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditSource } from "@/lib/admin-api/audit";
import { asAdminApiError, AdminApiError } from "@/lib/admin-api/errors";
import {
  downloadDriveImage,
  extractDriveFileId,
  loadGoogleCatalogSheet,
  mapCatalogRow,
  type CatalogSheetRow,
} from "@/lib/admin-api/google-drive-import";
import { normalizeName } from "@/lib/admin-api/normalization";
import { createProductSchema, type CreateProductInput } from "@/lib/admin-api/schemas";
import { findDuplicateSignals, createAdminProduct } from "@/services/admin-products";
import { uploadAdminImages } from "@/services/admin-uploads";
import type { Category } from "@/types";
import { slugify } from "@/utils/format";

const MAX_PUBLISH_PRODUCTS = 20;
const MAX_PUBLISH_IMAGES = 50;
const PRODUCT_IMAGES_BUCKET = "product-images";

type DuplicateCandidate = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
};

async function loadCatalogContext(client: SupabaseClient) {
  const [categoryResult, productResult] = await Promise.all([
    client.from("categories").select("*").order("name"),
    client.from("products").select("id,name,slug,sku").limit(5000),
  ]);
  if (categoryResult.error) {
    throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron consultar las categorías.");
  }
  if (productResult.error) {
    throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron comprobar productos repetidos.");
  }
  return {
    categories: (categoryResult.data ?? []) as Category[],
    products: (productResult.data ?? []) as DuplicateCandidate[],
  };
}

function resolveCategory(categories: Category[], reference: string) {
  const normalized = normalizeName(reference);
  return categories.find(
    (category) =>
      category.id === reference ||
      category.slug.toLowerCase() === reference.toLowerCase() ||
      normalizeName(category.name) === normalized,
  );
}

function rowError(row: CatalogSheetRow, error: unknown) {
  const normalized = asAdminApiError(error);
  return {
    row_number: row.rowNumber,
    name: row.values.name || null,
    success: false,
    can_publish: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    },
  };
}

function parseRow(row: CatalogSheetRow) {
  const mapped = mapCatalogRow(row);
  if (mapped.driveImageUrls.length > 10) {
    throw new AdminApiError(422, "TOO_MANY_FILES", "Cada producto puede tener hasta 10 imágenes.", [
      { field: "imagenes_drive", row_number: row.rowNumber },
    ]);
  }
  const driveImages = mapped.driveImageUrls.map((driveUrl, index) => {
    try {
      return { drive_url: driveUrl, file_id: extractDriveFileId(driveUrl), position: index };
    } catch (error) {
      const normalized = asAdminApiError(error);
      throw new AdminApiError(normalized.status, normalized.code, normalized.message, [
        ...normalized.details,
        { field: `imagenes_drive.${index}`, row_number: row.rowNumber },
      ]);
    }
  });
  return { input: createProductSchema.parse(mapped.candidate), driveImages };
}

export async function previewGoogleDriveCatalog(client: SupabaseClient, sheetUrl: string) {
  const [sheet, context] = await Promise.all([
    loadGoogleCatalogSheet(sheetUrl),
    loadCatalogContext(client),
  ]);
  const seenSlugs = new Map<string, number>();
  const seenSkus = new Map<string, number>();
  const results: unknown[] = [];
  let valid = 0;
  let publishable = 0;
  let visible = 0;

  for (const row of sheet.rows) {
    try {
      const { input, driveImages } = parseRow(row);
      const category = resolveCategory(context.categories, input.category);
      if (!category) {
        throw new AdminApiError(422, "CATEGORY_NOT_FOUND", `No existe la categoría '${input.category}'.`, [
          { field: "categoria", row_number: row.rowNumber },
        ]);
      }
      const slug = slugify(input.slug || input.name);
      if (!slug) throw new AdminApiError(422, "INVALID_SLUG", "No se pudo generar un slug válido.");
      const duplicates = findDuplicateSignals(context.products, {
        name: input.name,
        slug,
        sku: input.sku,
      });
      const previousSlugRow = seenSlugs.get(slug);
      const normalizedSku = input.sku?.trim().toLowerCase();
      const previousSkuRow = normalizedSku ? seenSkus.get(normalizedSku) : undefined;
      const warnings = [
        ...duplicates.warnings,
        ...(duplicates.slugConflict ? [`El slug ya pertenece al producto ${duplicates.slugConflict.id}.`] : []),
        ...(duplicates.skuConflict ? [`El SKU ya pertenece al producto ${duplicates.skuConflict.id}.`] : []),
        ...(previousSlugRow ? [`El slug se repite en la fila ${previousSlugRow} de esta planilla.`] : []),
        ...(previousSkuRow ? [`El SKU se repite en la fila ${previousSkuRow} de esta planilla.`] : []),
        ...(!driveImages.length ? ["El producto no tiene imágenes de Drive."] : []),
        ...(!driveImages.length && !["hidden", "archived"].includes(input.status)
          ? ["El producto quedaría visible sin imagen propia."]
          : []),
      ];
      const canPublish = !duplicates.slugConflict && !duplicates.skuConflict && !previousSlugRow && !previousSkuRow;
      valid += 1;
      if (canPublish) publishable += 1;
      if (canPublish && !["hidden", "archived"].includes(input.status)) visible += 1;
      results.push({
        row_number: row.rowNumber,
        success: true,
        can_publish: canPublish,
        product: { ...input, slug, category, images: [] },
        drive_images: driveImages,
        warnings,
      });
      if (!seenSlugs.has(slug)) seenSlugs.set(slug, row.rowNumber);
      if (normalizedSku && !seenSkus.has(normalizedSku)) seenSkus.set(normalizedSku, row.rowNumber);
    } catch (error) {
      results.push(rowError(row, error));
    }
  }

  return {
    sheet_hash: sheet.sheetHash,
    sheet_gid: sheet.gid,
    total_rows: sheet.rows.length,
    valid_rows: valid,
    invalid_rows: sheet.rows.length - valid,
    publishable_rows: publishable,
    visible_rows: visible,
    rows: results,
    next_step: "Revisá el resumen y pedí confirmación explícita antes de publicar.",
  };
}

function findSelectedRows(rows: CatalogSheetRow[], rowNumbers?: number[]) {
  if (!rowNumbers) return rows;
  const byNumber = new Map(rows.map((row) => [row.rowNumber, row]));
  const missing = rowNumbers.filter((rowNumber) => !byNumber.has(rowNumber));
  if (missing.length) {
    throw new AdminApiError(422, "ROWS_NOT_FOUND", "Algunas filas solicitadas no existen o están vacías.", [
      { row_numbers: missing },
    ]);
  }
  return rowNumbers.map((rowNumber) => byNumber.get(rowNumber)!);
}

export async function publishGoogleDriveCatalog(
  client: SupabaseClient,
  input: {
    sheetUrl: string;
    expectedSheetHash: string;
    rowNumbers?: number[];
  },
  source: AuditSource,
) {
  const sheet = await loadGoogleCatalogSheet(input.sheetUrl);
  if (sheet.sheetHash.toLowerCase() !== input.expectedSheetHash.toLowerCase()) {
    throw new AdminApiError(
      409,
      "SHEET_CHANGED",
      "La planilla cambió después de la vista previa. Volvé a revisarla antes de publicar.",
      [{ current_sheet_hash: sheet.sheetHash }],
    );
  }
  const selectedRows = findSelectedRows(sheet.rows, input.rowNumbers);
  if (selectedRows.length > MAX_PUBLISH_PRODUCTS) {
    throw new AdminApiError(
      422,
      "IMPORT_BATCH_TOO_LARGE",
      `Publicá en lotes de hasta ${MAX_PUBLISH_PRODUCTS} productos.`,
      [{ total_selected: selectedRows.length }],
    );
  }
  const totalImages = selectedRows.reduce((total, row) => total + mapCatalogRow(row).driveImageUrls.length, 0);
  if (totalImages > MAX_PUBLISH_IMAGES) {
    throw new AdminApiError(
      422,
      "IMPORT_TOO_MANY_IMAGES",
      `Cada lote puede descargar hasta ${MAX_PUBLISH_IMAGES} imágenes. Elegí menos filas.`,
      [{ total_images: totalImages }],
    );
  }

  const results: unknown[] = [];
  let created = 0;
  for (const row of selectedRows) {
    let uploaded: { storage_path: string; url: string }[] = [];
    try {
      const { input: productInput, driveImages } = parseRow(row);
      const files = await Promise.all(
        driveImages.map((image) => downloadDriveImage(image.drive_url, image.position)),
      );
      if (files.length) uploaded = await uploadAdminImages(client, files, source);
      const inputWithImages: CreateProductInput = {
        ...productInput,
        images: uploaded.map((image, position) => ({
          image_url: image.url,
          position,
          is_primary: position === 0,
        })),
      };
      const outcome = await createAdminProduct(client, inputWithImages, source);
      created += 1;
      results.push({
        row_number: row.rowNumber,
        success: true,
        id: outcome.product.id,
        name: outcome.product.name,
        status: outcome.product.status,
        images_uploaded: uploaded.length,
        warnings: outcome.warnings,
      });
    } catch (error) {
      if (uploaded.length) {
        await client.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploaded.map((image) => image.storage_path));
      }
      results.push(rowError(row, error));
    }
  }
  const failed = selectedRows.length - created;
  return {
    sheet_hash: sheet.sheetHash,
    total_selected: selectedRows.length,
    created,
    failed,
    results,
  };
}
