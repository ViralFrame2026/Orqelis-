import { createProductAction } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/services/catalog";

type Props = { searchParams: Promise<{ error?: string }> };
export default async function NewProductPage({ searchParams }: Props) {
  const [categories, query] = await Promise.all([getCategories(), searchParams]);
  return <div><div className="mb-7"><p className="text-xs font-black uppercase tracking-[.16em] text-clay">Catálogo</p><h1 className="font-display mt-2 text-4xl">Nuevo producto</h1></div><ProductForm categories={categories} action={createProductAction} error={query.error} /></div>;
}
