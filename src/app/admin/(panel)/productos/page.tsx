import Image from "next/image";
import Link from "next/link";
import { ImageUp, Plus } from "lucide-react";
import { AdminProductActions } from "@/components/admin/admin-product-actions";
import { getAllProductsForAdmin } from "@/services/catalog";
import { formatDate, formatPrice, STATUS_LABELS } from "@/utils/format";

type Props = { searchParams: Promise<{ success?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const [products, query] = await Promise.all([getAllProductsForAdmin(), searchParams]);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-clay">Catálogo</p>
          <h1 className="font-display mt-2 text-4xl">Productos</h1>
          <p className="mt-2 text-sm text-ink/48">Creá, editá y controlá qué se muestra en la tienda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/productos/importar-imagenes" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/12 bg-white px-4 text-sm font-extrabold text-ink">
            <ImageUp size={17} /> Importar imágenes
          </Link>
          <Link href="/admin/productos/nuevo" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white">
            <Plus size={17} /> Nuevo producto
          </Link>
        </div>
      </div>
      {query.success ? (
        <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">
          Producto {query.success === "created" ? "creado" : "actualizado"} correctamente.
        </p>
      ) : null}
      <div className="mt-7 overflow-hidden rounded-[1.4rem] border border-ink/8 bg-white">
        <div className="hidden grid-cols-[4rem_1.6fr_1fr_.7fr_.8fr_.6fr_auto] gap-4 border-b border-ink/8 bg-[#f8f6f2] px-5 py-3 text-[.64rem] font-black uppercase tracking-wider text-ink/44 lg:grid">
          <span>Foto</span><span>Producto</span><span>Categoría</span><span>Precio</span><span>Estado</span><span>Fecha</span><span>Acciones</span>
        </div>
        <div className="divide-y divide-ink/8">
          {products.map((product) => (
            <article key={product.id} className="grid gap-4 p-4 lg:grid-cols-[4rem_1.6fr_1fr_.7fr_.8fr_.6fr_auto] lg:items-center lg:px-5">
              <div className="relative size-16 overflow-hidden rounded-xl bg-cream">
                <Image src={product.images[0]?.image_url || "/products/placeholder.svg"} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{product.name}</p>
                {product.sku ? <p className="mt-0.5 text-[.65rem] font-bold text-ink/38">SKU {product.sku}</p> : null}
                <div className="mt-1 flex gap-1.5">
                  {product.featured ? <span className="rounded bg-sage px-1.5 py-0.5 text-[.58rem] font-black uppercase text-forest">Destacado</span> : null}
                  {product.offer ? <span className="rounded bg-clay/10 px-1.5 py-0.5 text-[.58rem] font-black uppercase text-clay">Oferta</span> : null}
                </div>
              </div>
              <p className="text-xs font-bold text-ink/50"><span className="mr-1 text-ink/30 lg:hidden">Categoría:</span>{product.category.name}</p>
              <p className="text-sm font-black">{formatPrice(product.price)}</p>
              <p>
                <span className={`rounded-full px-2 py-1 text-[.62rem] font-black ${product.status === "hidden" || product.status === "archived" ? "bg-ink/8 text-ink/48" : product.status === "sold_out" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {STATUS_LABELS[product.status]}
                </span>
              </p>
              <p className="text-xs font-bold text-ink/38">{formatDate(product.created_at)}</p>
              <AdminProductActions id={product.id} hidden={product.status === "hidden"} archived={product.status === "archived"} />
            </article>
          ))}
          {!products.length ? (
            <div className="px-6 py-16 text-center">
              <p className="font-display text-2xl">Tu catálogo está vacío</p>
              <p className="mt-2 text-sm text-ink/45">Creá el primer producto para empezar.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
