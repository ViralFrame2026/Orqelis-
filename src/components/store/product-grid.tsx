import type { Product } from "@/types";
import { ProductCard } from "@/components/store/product-card";

export function ProductGrid({ products, phone, baseUrl, emptyMessage = "No encontramos productos con esos filtros." }: { products: Product[]; phone: string; baseUrl: string; emptyMessage?: string }) {
  if (products.length === 0) {
    return <div className="rounded-[1.5rem] border border-dashed border-ink/16 bg-cream/60 px-6 py-16 text-center"><p className="font-display text-2xl text-ink">Todavía no hay productos acá</p><p className="mt-2 text-sm text-ink/55">{emptyMessage}</p></div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => <ProductCard key={product.id} product={product} phone={phone} baseUrl={baseUrl} priority={index < 2} />)}
    </div>
  );
}
