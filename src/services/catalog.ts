import { cache } from "react";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/data/demo";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";

type ProductRow = Omit<Product, "category" | "images" | "features"> & {
  categories: Category | Category[] | null;
  product_images: { id: string; image_url: string; position: number }[] | null;
  product_features: { id: string; feature: string }[] | null;
};

function mapProduct(row: ProductRow): Product {
  const { categories, product_images, product_features, ...product } = row;
  const category = Array.isArray(categories) ? categories[0] : categories;

  return {
    ...product,
    category: category || {
      id: row.category_id,
      name: "Sin categoría",
      slug: "sin-categoria",
      icon: "Package",
    },
    images: (product_images || [])
      .toSorted((a, b) => a.position - b.position)
      .map(({ id, image_url, position }) => ({ id, image_url, position })),
    features: (product_features || []).map(({ feature }) => feature),
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();
  if (!supabase) return DEMO_PRODUCTS;

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*), product_images(*), product_features(*)")
    .not("status", "in", "(hidden,archived)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("No se pudo cargar el catálogo:", error.message);
    return DEMO_PRODUCTS;
  }

  return ((data || []) as unknown as ProductRow[]).map(mapProduct);
});

export const getAllProductsForAdmin = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*), product_images(*), product_features(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as unknown as ProductRow[]).map(mapProduct);
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) || null;
});

export const getProductByIdForAdmin = cache(async (id: string): Promise<Product | null> => {
  const products = await getAllProductsForAdmin();
  return products.find((product) => product.id === id) || null;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  if (!supabase) {
    return DEMO_CATEGORIES.map((category) => ({
      ...category,
      product_count: DEMO_PRODUCTS.filter((product) => product.category_id === category.id).length,
    }));
  }

  const [{ data: categories, error }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("category_id").not("status", "in", "(hidden,archived)"),
  ]);

  if (error) {
    console.error("No se pudieron cargar las categorías:", error.message);
    return DEMO_CATEGORIES;
  }

  const counts = new Map<string, number>();
  (products || []).forEach(({ category_id }) =>
    counts.set(category_id, (counts.get(category_id) || 0) + 1),
  );

  return (categories || []).map((category) => ({
    ...category,
    product_count: counts.get(category.id) || 0,
  })) as Category[];
});
