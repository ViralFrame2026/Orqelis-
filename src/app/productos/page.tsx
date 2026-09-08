import type { Metadata } from "next";
import { ProductsExplorer } from "@/components/store/products-explorer";
import { SITE_URL } from "@/config/site";
import { getCategories, getProducts } from "@/services/catalog";
import { getSiteSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explorá todos nuestros productos de electro, bazar, hogar, termos, mates y personalizados.",
};

export default async function ProductsPage() {
  const [products, categories, settings] = await Promise.all([getProducts(), getCategories(), getSiteSettings()]);
  return (
    <div className="container-store py-10 sm:py-16">
      <div className="mb-9 max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-clay">Todo en un solo lugar</p><h1 className="font-display mt-3 text-4xl tracking-tight sm:text-6xl">Nuestro catálogo</h1><p className="mt-4 text-base leading-7 text-ink/60">Buscá por nombre, categoría o característica y filtrá hasta encontrar justo lo que necesitás.</p></div>
      <ProductsExplorer products={products} categories={categories} phone={settings.whatsappNumber} baseUrl={SITE_URL} />
    </div>
  );
}
