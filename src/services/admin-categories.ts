import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminActivity, type AuditSource } from "@/lib/admin-api/audit";
import { AdminApiError } from "@/lib/admin-api/errors";
import { normalizeName } from "@/lib/admin-api/normalization";
import { slugify } from "@/utils/format";

type CategoryInput = { name: string; slug?: string; icon?: string };

export async function listAdminCategories(client: SupabaseClient) {
  const [{ data, error }, { data: products, error: productsError }] = await Promise.all([
    client.from("categories").select("*").order("name"),
    client.from("products").select("category_id"),
  ]);
  if (error || productsError) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudieron consultar las categorías.");
  const counts = new Map<string, number>();
  for (const product of products ?? []) counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  return (data ?? []).map((category) => ({ ...category, product_count: counts.get(category.id) ?? 0 }));
}

async function assertUniqueCategory(client: SupabaseClient, name: string, slug: string, excludeId?: string) {
  const categories = await listAdminCategories(client);
  const duplicate = categories.find(
    (category) =>
      category.id !== excludeId &&
      (category.slug === slug || normalizeName(category.name) === normalizeName(name)),
  );
  if (duplicate) {
    throw new AdminApiError(409, "DUPLICATE_CATEGORY", "Ya existe una categoría con ese nombre o slug.", [
      { category_id: duplicate.id },
    ]);
  }
}

export async function createAdminCategory(client: SupabaseClient, input: CategoryInput, source: AuditSource) {
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new AdminApiError(422, "INVALID_SLUG", "El slug no es válido.");
  await assertUniqueCategory(client, input.name, slug);
  const { data, error } = await client
    .from("categories")
    .insert({ name: input.name, slug, icon: input.icon ?? "Package" })
    .select("*")
    .single();
  if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo crear la categoría.");
  await logAdminActivity(client, {
    action: "category_created",
    entityType: "category",
    entityId: data.id,
    source,
    summary: { name: data.name, slug: data.slug },
  });
  return data;
}

export async function updateAdminCategory(
  client: SupabaseClient,
  id: string,
  input: Partial<CategoryInput>,
  source: AuditSource,
) {
  const { data: current, error: currentError } = await client.from("categories").select("*").eq("id", id).maybeSingle();
  if (currentError) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo consultar la categoría.");
  if (!current) throw new AdminApiError(404, "CATEGORY_NOT_FOUND", "La categoría no existe.");
  const name = input.name ?? current.name;
  const slug = input.slug !== undefined ? slugify(input.slug || name) : current.slug;
  if (!slug) throw new AdminApiError(422, "INVALID_SLUG", "El slug no es válido.");
  await assertUniqueCategory(client, name, slug, id);
  const { data, error } = await client
    .from("categories")
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new AdminApiError(503, "DATABASE_ERROR", "No se pudo modificar la categoría.");
  await logAdminActivity(client, {
    action: "category_updated",
    entityType: "category",
    entityId: id,
    source,
    summary: { fields: Object.keys(input) },
  });
  return data;
}

