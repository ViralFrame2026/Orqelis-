import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories, getProductByIdForAdmin } from "@/services/catalog";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [categories, product] = await Promise.all([getCategories(), getProductByIdForAdmin(id)]);
  if (!product) notFound();
  return <div><div className="mb-7"><p className="text-xs font-black uppercase tracking-[.16em] text-clay">Catálogo</p><h1 className="font-display mt-2 text-4xl">Editar producto</h1></div><ProductForm categories={categories} product={product} action={updateProductAction.bind(null, id)} error={query.error} /></div>;
}
