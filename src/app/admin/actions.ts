"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/lib/admin-api/audit";
import { validateImageFile } from "@/lib/admin-api/uploads";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/services/auth";
import { slugify } from "@/utils/format";

const PRODUCT_IMAGES_BUCKET = "product-images";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const optionalNumber = (value: FormDataEntryValue | null) => {
  const parsed = Number(value);
  return value === null || value === "" || Number.isNaN(parsed) ? null : parsed;
};

function storagePathFromPublicUrl(imageUrl: string) {
  try {
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const pathname = new URL(imageUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex === -1
      ? null
      : decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function deleteProductImages(productId: string, imageIds?: string[]) {
  if (imageIds && imageIds.length === 0) return;

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase no está configurado.");

  let query = supabase
    .from("product_images")
    .select("id, image_url")
    .eq("product_id", productId);

  if (imageIds) query = query.in("id", imageIds);

  const { data: images, error: selectError } = await query;
  if (selectError) throw new Error(selectError.message);
  if (!images?.length) return;

  const storagePaths = images
    .map(({ image_url }) => storagePathFromPublicUrl(image_url))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(storagePaths);
    if (storageError) throw new Error(storageError.message);
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .in("id", images.map(({ id }) => id));
  if (deleteError) throw new Error(deleteError.message);
}

async function uploadProductImages(productId: string, files: File[]) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data: lastImage } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  let position = (lastImage?.position ?? -1) + 1;
  const rows: { product_id: string; image_url: string; position: number }[] = [];
  const uploadedPaths: string[] = [];

  for (const file of files) {
    if (!file.size) continue;
    await validateImageFile(file);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${productId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(`No se pudo subir ${file.name}: ${error.message}`);
    uploadedPaths.push(path);
    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    rows.push({ product_id: productId, image_url: data.publicUrl, position: position++ });
  }

  if (rows.length) {
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploadedPaths);
      throw new Error(error.message);
    }
  }
}

function productPayload(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const requestedSlug = String(formData.get("slug") || "").trim();
  return {
    name,
    slug: slugify(requestedSlug || name),
    sku: String(formData.get("sku") || "").trim() || null,
    category_id: String(formData.get("category_id") || ""),
    short_description: String(formData.get("short_description") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: Number(formData.get("price") || 0),
    previous_price: optionalNumber(formData.get("previous_price")),
    installments: optionalNumber(formData.get("installments")),
    installment_price: optionalNumber(formData.get("installment_price")),
    stock: optionalNumber(formData.get("stock")),
    status: String(formData.get("status") || "available"),
    tags: String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    featured: formData.get("featured") === "on",
    offer: formData.get("offer") === "on",
    is_new: formData.get("is_new") === "on",
  };
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/admin/login?setup=required");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/admin/login?error=credentials");
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-authorized");
  }
  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) redirect("/admin/login?setup=required");
  const payload = productPayload(formData);
  const { data: product, error } = await supabase.from("products").insert(payload).select("id").single();
  if (error) redirect(`/admin/productos/nuevo?error=${encodeURIComponent(error.message)}`);
  const features = String(formData.get("features") || "").split("\n").map((feature) => feature.trim()).filter(Boolean);
  if (features.length) await supabase.from("product_features").insert(features.map((feature) => ({ product_id: product.id, feature })));
  await uploadProductImages(product.id, formData.getAll("images").filter((item): item is File => item instanceof File));
  await logAdminActivity(supabase, { action: "product_created", entityType: "product", entityId: product.id, source: "admin_panel", summary: { name: payload.name, slug: payload.slug, sku: payload.sku } });
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  redirect("/admin/productos?success=created");
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) redirect("/admin/login?setup=required");
  const payload = productPayload(formData);
  const { data: before } = await supabase.from("products").select("name,price,stock,status").eq("id", id).maybeSingle();
  const deletedImageIds = formData
    .getAll("delete_image_ids")
    .map(String)
    .filter((imageId) => UUID_PATTERN.test(imageId));
  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) redirect(`/admin/productos/${id}/editar?error=${encodeURIComponent(error.message)}`);
  await deleteProductImages(id, deletedImageIds);
  await supabase.from("product_features").delete().eq("product_id", id);
  const features = String(formData.get("features") || "").split("\n").map((feature) => feature.trim()).filter(Boolean);
  if (features.length) await supabase.from("product_features").insert(features.map((feature) => ({ product_id: id, feature })));
  await uploadProductImages(id, formData.getAll("images").filter((item): item is File => item instanceof File));
  await logAdminActivity(supabase, { action: "product_updated", entityType: "product", entityId: id, source: "admin_panel", summary: { name: payload.name } });
  if (before && Number(before.price) !== payload.price) await logAdminActivity(supabase, { action: "price_changed", entityType: "product", entityId: id, source: "admin_panel", summary: { from: Number(before.price), to: payload.price } });
  if (before && before.stock !== payload.stock) await logAdminActivity(supabase, { action: "stock_changed", entityType: "product", entityId: id, source: "admin_panel", summary: { from: before.stock, to: payload.stock } });
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  redirect("/admin/productos?success=updated");
}

export async function duplicateProductAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  const { data: source } = await supabase.from("products").select("*, product_images(*), product_features(*)").eq("id", id).single();
  if (!source) return;
  const { product_images, product_features, id: _id, created_at: _created, updated_at: _updated, ...values } = source;
  void _id; void _created; void _updated;
  const suffix = Date.now().toString().slice(-6);
  const { data: copy } = await supabase.from("products").insert({ ...values, sku: null, name: `${values.name} (copia)`, slug: `${values.slug}-copia-${suffix}`, status: "hidden" }).select("id").single();
  if (copy) {
    if (product_images?.length) await supabase.from("product_images").insert(product_images.map((image: { image_url: string; position: number }) => ({ product_id: copy.id, image_url: image.image_url, position: image.position })));
    if (product_features?.length) await supabase.from("product_features").insert(product_features.map((feature: { feature: string }) => ({ product_id: copy.id, feature: feature.feature })));
    await logAdminActivity(supabase, { action: "product_created", entityType: "product", entityId: copy.id, source: "admin_panel", summary: { duplicated_from: id, name: `${values.name} (copia)` } });
  }
  revalidatePath("/admin/productos");
}

export async function toggleProductVisibilityAction(id: string, currentlyHidden: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("products").update({ status: currentlyHidden ? "available" : "hidden" }).eq("id", id);
  await logAdminActivity(supabase, { action: "product_updated", entityType: "product", entityId: id, source: "admin_panel", summary: { status: currentlyHidden ? "available" : "hidden" } });
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  const { data: product } = await supabase.from("products").select("name,status").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id);
  if (!error) await logAdminActivity(supabase, { action: "product_archived", entityType: "product", entityId: id, source: "admin_panel", summary: { name: product?.name, previous_status: product?.status } });
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  const name = String(formData.get("name") || "").trim();
  const { data: category } = await supabase.from("categories").insert({ name, slug: slugify(String(formData.get("slug") || name)), icon: String(formData.get("icon") || "Package") }).select("id,slug").maybeSingle();
  if (category) await logAdminActivity(supabase, { action: "category_created", entityType: "category", entityId: category.id, source: "admin_panel", summary: { name, slug: category.slug } });
  revalidatePath("/admin/categorias"); revalidatePath("/");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  const name = String(formData.get("name") || "").trim();
  await supabase.from("categories").update({ name, slug: slugify(String(formData.get("slug") || name)), icon: String(formData.get("icon") || "Package") }).eq("id", id);
  await logAdminActivity(supabase, { action: "category_updated", entityType: "category", entityId: id, source: "admin_panel", summary: { name } });
  revalidatePath("/admin/categorias"); revalidatePath("/");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (!error) await logAdminActivity(supabase, { action: "category_deleted", entityType: "category", entityId: id, source: "admin_panel" });
  revalidatePath("/admin/categorias"); revalidatePath("/");
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) return;
  const values = [
    ["store_name", formData.get("store_name")], ["whatsapp_number", formData.get("whatsapp_number")],
    ["instagram_url", formData.get("instagram_url")], ["shipping_text", formData.get("shipping_text")],
    ["delivery_text", formData.get("delivery_text")], ["email", formData.get("email")],
  ].map(([key, value]) => ({ key, value: String(value || "") }));
  await supabase.from("settings").upsert(values, { onConflict: "key" });
  await logAdminActivity(supabase, { action: "settings_updated", entityType: "settings", source: "admin_panel", summary: { fields: values.map(({ key }) => key) } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
  redirect("/admin/configuracion?success=saved");
}
