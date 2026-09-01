import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminActivity, type AuditSource } from "@/lib/admin-api/audit";
import { AdminApiError } from "@/lib/admin-api/errors";
import { normalizeName } from "@/lib/admin-api/normalization";
import type {
  CreateProductInput,
  PatchProductInput,
  ProductFiltersInput,
} from "@/lib/admin-api/schemas";
import type { Category, Product, ProductImage } from "@/types";
import { slugify } from "@/utils/format";

type ProductRow = Omit<Product, "category" | "images" | "features"> & {
  categories: Category | Category[] | null;
  product_images: ProductImage[] | null;
  product_features: { feature: string }[] | null;
};

type DuplicateCandidate = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
};

const PRODUCT_SELECT = "*, categories(*), product_images(*), product_features(*)";

function mapProduct(row: ProductRow): Product {
  const { categories, product_images, product_features, ...product } = row;
  const category = Array.isArray(categories) ? categories[0] : categories;
  return {
    ...product,
    category: category ?? {
      id: row.category_id,
      name: "Sin categoría",
      slug: "sin-categoria",
      icon: "Package",
    },
    images: (product_images ?? [])
      .toSorted((a, b) => a.position - b.position)
      .map(({ id, image_url, position }) => ({ id, image_url, position })),
    features: (product_features ?? []).map(({ feature }) => feature),
  };
}

export function findDuplicateSignals(
  candidates: DuplicateCandidate[],
  input: { name: string; slug: string; sku?: string | null },
  excludeId?: string,
) {
  const eligible = candidates.filter((candidate) => candidate.id !== excludeId);
  const slugConflict = eligible.find((candidate) => candidate.slug === input.slug);
  const skuConflict = input.sku
    ? eligible.find((candidate) => candidate.sku?.trim().toLowerCase() === input.sku?.trim().toLowerCase())
    : undefined;
  const nameMatch = eligible.find(
    (candidate) => normalizeName(candidate.name) === normalizeName(input.name),
  );
  const warnings = nameMatch
    ? [`Posible duplicado por nombre: ${nameMatch.name} (${nameMatch.id}).`]
    : [];
  return { slugConflict, skuConflict, nameMatch, warnings };
}

async function getDuplicateCandidates(client: SupabaseClient) {
  const { data, error } = await client.from("products").select("id,name,slug,sku").limit(5000);
  if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron comprobar duplicados.");
  return (data ?? []) as DuplicateCandidate[];
}

async function resolveCategory(client: SupabaseClient, reference: string) {
  const { data, error } = await client.from("categories").select("*").order("name");
  if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo consultar la categoría.");
  const normalized = normalizeName(reference);
  const category = (data ?? []).find(
    (item) =>
      item.id === reference ||
      item.slug.toLowerCase() === reference.toLowerCase() ||
      normalizeName(item.name) === normalized,
  );
  if (!category) {
    throw new AdminApiError(422, "CATEGORY_NOT_FOUND", `No existe la categoría '${reference}'.`, [
      { field: "category" },
    ]);
  }
  return category as Category;
}

function normalizeImages(images: CreateProductInput["images"]) {
  return images
    .map((image, index) => ({ ...image, originalIndex: index }))
    .toSorted((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.position ?? a.originalIndex) - (b.position ?? b.originalIndex);
    })
    .map((image, position) => ({ image_url: image.image_url, position }));
}

async function insertRelations(
  client: SupabaseClient,
  productId: string,
  features: string[],
  images: CreateProductInput["images"],
) {
  if (features.length) {
    const { error } = await client
      .from("product_features")
      .insert(features.map((feature) => ({ product_id: productId, feature })));
    if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron guardar las características.");
  }
  const normalizedImages = normalizeImages(images);
  if (normalizedImages.length) {
    const { error } = await client
      .from("product_images")
      .insert(normalizedImages.map((image) => ({ product_id: productId, ...image })));
    if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron guardar las imágenes.");
  }
}

async function replaceRelations(
  client: SupabaseClient,
  productId: string,
  input: PatchProductInput,
) {
  if (input.features !== undefined) {
    const { error: deleteError } = await client.from("product_features").delete().eq("product_id", productId);
    if (deleteError) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron actualizar las características.");
    if (input.features.length) {
      const { error } = await client
        .from("product_features")
        .insert(input.features.map((feature) => ({ product_id: productId, feature })));
      if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron actualizar las características.");
    }
  }
  if (input.images !== undefined) {
    const { error: deleteError } = await client.from("product_images").delete().eq("product_id", productId);
    if (deleteError) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron actualizar las imágenes.");
    const normalizedImages = normalizeImages(input.images);
    if (normalizedImages.length) {
      const { error } = await client
        .from("product_images")
        .insert(normalizedImages.map((image) => ({ product_id: productId, ...image })));
      if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron actualizar las imágenes.");
    }
  }
}

export async function getAdminProduct(client: SupabaseClient, id: string) {
  const { data, error } = await client.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo consultar el producto.");
  if (!data) throw new AdminApiError(404, "PRODUCT_NOT_FOUND", "El producto no existe.");
  return mapProduct(data as unknown as ProductRow);
}

export async function listAdminProducts(client: SupabaseClient, filters: ProductFiltersInput) {
  let query = client
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.category) {
    const category = await resolveCategory(client, filters.category);
    query = query.eq("category_id", category.id);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.featured !== undefined) query = query.eq("featured", filters.featured);
  if (filters.offer !== undefined) query = query.eq("offer", filters.offer);
  if (filters.search) {
    const safeSearch = filters.search.replace(/[^\p{L}\p{N}\s._-]+/gu, " ").trim();
    if (safeSearch) query = query.or(`name.ilike.*${safeSearch}*,slug.ilike.*${safeSearch}*,sku.ilike.*${safeSearch}*`);
  }

  const { data, error, count } = await query.range(
    filters.offset,
    filters.offset + filters.limit - 1,
  );
  if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron consultar los productos.");
  return {
    products: ((data ?? []) as unknown as ProductRow[]).map(mapProduct),
    total: count ?? 0,
    limit: filters.limit,
    offset: filters.offset,
  };
}

export async function previewAdminProduct(client: SupabaseClient, input: CreateProductInput) {
  const category = await resolveCategory(client, input.category);
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new AdminApiError(422, "INVALID_SLUG", "No se pudo generar un slug válido.");
  const duplicates = findDuplicateSignals(await getDuplicateCandidates(client), {
    name: input.name,
    slug,
    sku: input.sku,
  });
  return {
    product: {
      ...input,
      slug,
      category,
      images: normalizeImages(input.images),
    },
    warnings: [
      ...duplicates.warnings,
      ...(duplicates.slugConflict ? [`El slug ya pertenece al producto ${duplicates.slugConflict.id}.`] : []),
      ...(duplicates.skuConflict ? [`El SKU ya pertenece al producto ${duplicates.skuConflict.id}.`] : []),
    ],
    can_create: !duplicates.slugConflict && !duplicates.skuConflict,
  };
}

export async function createAdminProduct(
  client: SupabaseClient,
  input: CreateProductInput,
  source: AuditSource,
) {
  const category = await resolveCategory(client, input.category);
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new AdminApiError(422, "INVALID_SLUG", "No se pudo generar un slug válido.");
  const duplicates = findDuplicateSignals(await getDuplicateCandidates(client), {
    name: input.name,
    slug,
    sku: input.sku,
  });
  if (duplicates.slugConflict || duplicates.skuConflict) {
    throw new AdminApiError(409, "DUPLICATE_PRODUCT", "Ya existe un producto con el mismo slug o SKU.", [
      ...(duplicates.slugConflict ? [{ field: "slug", product_id: duplicates.slugConflict.id }] : []),
      ...(duplicates.skuConflict ? [{ field: "sku", product_id: duplicates.skuConflict.id }] : []),
    ]);
  }

  const { features, images, category: _category, ...inputValues } = input;
  void _category;
  const { data, error } = await client
    .from("products")
    .insert({ ...inputValues, slug, category_id: category.id })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new AdminApiError(409, "DUPLICATE_PRODUCT", "El slug o SKU ya existe.");
    throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo crear el producto.");
  }

  try {
    await insertRelations(client, data.id, features, images);
  } catch (relationError) {
    await client.from("products").delete().eq("id", data.id);
    throw relationError;
  }
  await logAdminActivity(client, {
    action: "product_created",
    entityType: "product",
    entityId: data.id,
    source,
    summary: { name: input.name, slug, sku: input.sku ?? null },
  });
  return { product: await getAdminProduct(client, data.id), warnings: duplicates.warnings };
}

export async function updateAdminProduct(
  client: SupabaseClient,
  id: string,
  input: PatchProductInput,
  source: AuditSource,
) {
  const before = await getAdminProduct(client, id);
  const nextName = input.name ?? before.name;
  const nextSlug = input.slug !== undefined ? slugify(input.slug || nextName) : before.slug;
  const nextSku = input.sku !== undefined ? input.sku : before.sku;
  if (!nextSlug) throw new AdminApiError(422, "INVALID_SLUG", "El slug no es válido.");
  const duplicates = findDuplicateSignals(await getDuplicateCandidates(client), {
    name: nextName,
    slug: nextSlug,
    sku: nextSku,
  }, id);
  if (duplicates.slugConflict || duplicates.skuConflict) {
    throw new AdminApiError(409, "DUPLICATE_PRODUCT", "Otro producto ya utiliza ese slug o SKU.");
  }

  const values: Record<string, unknown> = {};
  const scalarKeys = [
    "name", "sku", "short_description", "description", "price", "previous_price",
    "installments", "installment_price", "stock", "status", "featured", "offer", "is_new", "tags",
  ] as const;
  for (const key of scalarKeys) if (input[key] !== undefined) values[key] = input[key];
  if (input.slug !== undefined) values.slug = nextSlug;
  if (input.category !== undefined) values.category_id = (await resolveCategory(client, input.category)).id;

  if (Object.keys(values).length) {
    const { error } = await client.from("products").update(values).eq("id", id);
    if (error) {
      if (error.code === "23505") throw new AdminApiError(409, "DUPLICATE_PRODUCT", "El slug o SKU ya existe.");
      throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo modificar el producto.");
    }
  }
  await replaceRelations(client, id, input);
  const after = await getAdminProduct(client, id);
  await logAdminActivity(client, {
    action: "product_updated",
    entityType: "product",
    entityId: id,
    source,
    summary: { fields: Object.keys(input) },
  });
  if (before.price !== after.price) {
    await logAdminActivity(client, {
      action: "price_changed",
      entityType: "product",
      entityId: id,
      source,
      summary: { from: before.price, to: after.price },
    });
  }
  if (before.stock !== after.stock) {
    await logAdminActivity(client, {
      action: "stock_changed",
      entityType: "product",
      entityId: id,
      source,
      summary: { from: before.stock, to: after.stock },
    });
  }
  return { product: after, warnings: duplicates.warnings };
}

export async function archiveAdminProduct(
  client: SupabaseClient,
  id: string,
  source: AuditSource,
) {
  const before = await getAdminProduct(client, id);
  if (before.status !== "archived") {
    const { error } = await client.from("products").update({ status: "archived" }).eq("id", id);
    if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo archivar el producto.");
    await logAdminActivity(client, {
      action: "product_archived",
      entityType: "product",
      entityId: id,
      source,
      summary: { previous_status: before.status, name: before.name },
    });
  }
  return getAdminProduct(client, id);
}
