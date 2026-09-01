import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductsExplorer } from "@/components/store/products-explorer";
import { SITE_URL } from "@/config/site";
import { getCategories, getProducts } from "@/services/catalog";
import { getSiteSettings } from "@/services/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);
  return category ? { title: category.name, description: `Descubrí productos de ${category.name.toLowerCase()} disponibles.` } : { title: "Categoría" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "ofertas") {
    const { redirect } = await import("next/navigation");
    redirect("/ofertas");
  }
  const [products, categories, settings] = await Promise.all([getProducts(), getCategories(), getSiteSettings()]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  return (
    <div className="container-store py-10 sm:py-16">
      <div className="mb-9 max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-clay">Categoría</p><h1 className="font-display mt-3 text-4xl tracking-tight sm:text-6xl">{category.name}</h1><p className="mt-4 text-base leading-7 text-ink/60">Encontrá todo lo disponible en {category.name.toLowerCase()} y consultanos por WhatsApp.</p></div>
      <ProductsExplorer products={products} categories={categories} phone={settings.whatsappNumber} baseUrl={SITE_URL} initialCategory={slug} />
    </div>
  );
}
