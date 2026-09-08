"use server";

import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin-api/audit";
import {
  buildBulkStoragePath,
  isDiscardableBulkStoragePath,
  isSafeBulkStoragePath,
  matchBulkImageFilenames,
  normalizeImageFilename,
  PRODUCT_IMAGES_BUCKET,
  validateBulkImageDescriptor,
  type ImageFilenameMapping,
} from "@/lib/admin-api/bulk-image-import";
import { validateImageMetadata } from "@/lib/admin-api/uploads";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/services/auth";

type MappingRow = {
  product_id: string;
  image_filename: string;
  products: { id: string; name: string; slug?: string } | { id: string; name: string; slug?: string }[];
};

type PreparedUpload = {
  productId: string;
  productName: string;
  path: string;
  token: string;
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function firstProduct(row: MappingRow) {
  return Array.isArray(row.products) ? row.products[0] : row.products;
}

function storagePathFromPublicUrl(imageUrl: string) {
  try {
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const pathname = new URL(imageUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex === -1 ? null : decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

function readableError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function getAllMappings(): Promise<ImageFilenameMapping[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_image_filename_map")
    .select("product_id,image_filename,products!inner(id,name)");
  if (error) throw new Error(`No se pudo leer la relación de imágenes: ${error.message}`);
  return ((data ?? []) as unknown as MappingRow[]).flatMap((row) => {
    const product = firstProduct(row);
    return product
      ? [{ productId: row.product_id, productName: product.name, imageFilename: row.image_filename }]
      : [];
  });
}

async function getMapping(filename: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_image_filename_map")
    .select("product_id,image_filename,products!inner(id,name,slug)")
    .eq("image_filename_key", normalizeImageFilename(filename))
    .maybeSingle();
  if (error) throw new Error(`No se pudo validar el producto: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as MappingRow;
  const product = firstProduct(row);
  return product ? { row, product } : null;
}

async function removePreparedPath(path: string) {
  if (!isDiscardableBulkStoragePath(path)) return;
  await createAdminClient().storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}

export async function previewBulkImageImportAction(filenames: string[]) {
  await requireAdmin();
  if (!Array.isArray(filenames) || filenames.length < 1 || filenames.length > 500) {
    return { ok: false, error: "El ZIP debe contener entre 1 y 500 imágenes válidas." } as const;
  }
  if (filenames.some((filename) => typeof filename !== "string" || filename.length > 600)) {
    return { ok: false, error: "El ZIP contiene un nombre de archivo inválido." } as const;
  }
  try {
    const mappings = await getAllMappings();
    return { ok: true, data: matchBulkImageFilenames(filenames, mappings) } as const;
  } catch (error) {
    return { ok: false, error: readableError(error, "No se pudo preparar la vista previa.") } as const;
  }
}

export async function prepareBulkImageUploadAction(input: {
  filename: string;
  type: string;
  size: number;
}): Promise<ActionResult<PreparedUpload>> {
  await requireAdmin();
  try {
    const descriptor = validateBulkImageDescriptor(input);
    const mapping = await getMapping(descriptor.filename);
    if (!mapping) return { ok: false, error: "El archivo ya no tiene un producto asociado." };

    const path = buildBulkStoragePath(
      mapping.product.id,
      descriptor.filename,
      crypto.randomUUID(),
    );
    const { data, error } = await createAdminClient().storage
      .from(PRODUCT_IMAGES_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !data) {
      return { ok: false, error: `Storage no pudo preparar la carga: ${error?.message ?? "error desconocido"}` };
    }
    return {
      ok: true,
      data: {
        productId: mapping.product.id,
        productName: mapping.product.name,
        path,
        token: data.token,
      },
    };
  } catch (error) {
    return { ok: false, error: readableError(error, "No se pudo preparar la imagen.") };
  }
}

export async function finalizeBulkImageUploadAction(input: {
  filename: string;
  path: string;
}): Promise<ActionResult<{ productId: string; productName: string; warning?: string }>> {
  await requireAdmin();
  const supabase = createAdminClient();
  let canDiscard = false;

  try {
    const mapping = await getMapping(input.filename);
    if (!mapping) throw new Error("El archivo ya no tiene un producto asociado.");
    canDiscard = isSafeBulkStoragePath(mapping.product.id, input.filename, input.path);
    if (!canDiscard) throw new Error("La ruta de Storage no pertenece a este producto.");

    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .download(input.path);
    if (downloadError || !imageBlob) {
      throw new Error(`Storage no pudo verificar la imagen: ${downloadError?.message ?? "archivo ausente"}`);
    }

    const bytes = new Uint8Array(await imageBlob.slice(0, 16).arrayBuffer());
    validateImageMetadata({
      name: input.filename,
      type: imageBlob.type,
      size: imageBlob.size,
      bytes,
    });

    const { data: previousImages, error: previousError } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", mapping.product.id);
    if (previousError) throw new Error(`No se pudo leer la imagen anterior: ${previousError.message}`);

    const { data: publicData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(input.path);
    const { error: replacementError } = await supabase.rpc("replace_product_image", {
      p_product_id: mapping.product.id,
      p_image_url: publicData.publicUrl,
    });
    if (replacementError) throw new Error(`No se pudo reemplazar la imagen: ${replacementError.message}`);

    const oldPaths = (previousImages ?? [])
      .map(({ image_url }) => storagePathFromPublicUrl(image_url))
      .filter((path): path is string => Boolean(path) && path !== input.path);
    let warning: string | undefined;
    if (oldPaths.length) {
      const { error: cleanupError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove(oldPaths);
      if (cleanupError) warning = `La imagen se reemplazó, pero Storage no pudo borrar un archivo anterior: ${cleanupError.message}`;
    }

    await logAdminActivity(supabase, {
      action: "product_image_replaced",
      entityType: "product",
      entityId: mapping.product.id,
      source: "admin_panel",
      summary: {
        image_filename: mapping.row.image_filename,
        previous_images: previousImages?.length ?? 0,
        bulk_import: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/productos");
    revalidatePath(`/producto/${mapping.product.slug}`);
    revalidatePath("/admin/productos");
    return {
      ok: true,
      data: { productId: mapping.product.id, productName: mapping.product.name, warning },
    };
  } catch (error) {
    if (canDiscard) await removePreparedPath(input.path);
    return { ok: false, error: readableError(error, "No se pudo confirmar el reemplazo.") };
  }
}

export async function discardBulkImageUploadAction(path: string) {
  await requireAdmin();
  try {
    await removePreparedPath(path);
    return { ok: true } as const;
  } catch {
    return { ok: false } as const;
  }
}

