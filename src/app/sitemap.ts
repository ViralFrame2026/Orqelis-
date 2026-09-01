import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getCategories, getProducts } from "@/services/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const staticPages = ["", "/productos", "/ofertas", "/entregas", "/contacto"].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.8 }));
  return [...staticPages, ...products.map((product) => ({ url: `${SITE_URL}/producto/${product.slug}`, lastModified: new Date(product.updated_at), changeFrequency: "weekly" as const, priority: 0.7 })), ...categories.map((category) => ({ url: `${SITE_URL}/categoria/${category.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 }))];
}
