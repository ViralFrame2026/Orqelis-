import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/types";
import { formatPrice, STATUS_LABELS } from "@/utils/format";
import { generateWhatsAppLink } from "@/utils/whatsapp";

type ProductCardProps = {
  product: Product;
  phone: string;
  baseUrl: string;
  priority?: boolean;
};

export function ProductCard({ product, phone, baseUrl, priority = false }: ProductCardProps) {
  const isSoldOut = product.status === "sold_out";
  const canAddToCart = ["available", "last_units"].includes(product.status);
  const image = product.images[0]?.image_url || "/products/placeholder.svg";
  const cartProduct = { id: product.id, name: product.name, slug: product.slug, price: product.price, image_url: image };

  return (
    <article className="product-card-shadow group flex min-w-0 flex-col overflow-hidden rounded-[1.3rem] border border-ink/8 bg-white transition duration-300 hover:-translate-y-1 hover:border-clay/30">
      <Link href={`/producto/${product.slug}`} className="focus-ring relative aspect-[1/1.05] overflow-hidden bg-cream">
        <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.035]" loading={priority ? "eager" : "lazy"} />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3">
          {product.offer ? <span className="rounded-full bg-clay px-2 py-1 text-[0.58rem] font-black uppercase tracking-wider text-white sm:px-2.5">Oferta</span> : null}
          {product.is_new ? <span className="rounded-full bg-ink px-2 py-1 text-[0.58rem] font-black uppercase tracking-wider text-white sm:px-2.5">Nuevo</span> : null}
          {product.status === "last_units" ? <span className="rounded-full bg-[#e7ac3f] px-2 py-1 text-[0.58rem] font-black uppercase tracking-wider text-ink">Últimas</span> : null}
          {isSoldOut ? <span className="rounded-full bg-white px-2 py-1 text-[0.58rem] font-black uppercase tracking-wider text-ink">Agotado</span> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.13em] text-clay">{product.category.name}</p>
        <Link href={`/producto/${product.slug}`} className="focus-ring mt-1.5 line-clamp-2 rounded-md text-sm font-extrabold leading-snug text-ink sm:text-base">{product.name}</Link>
        <div className="mt-3">
          {product.previous_price ? <p className="text-[0.68rem] font-semibold text-ink/42 line-through sm:text-xs">{formatPrice(product.previous_price)}</p> : null}
          <p className="text-lg font-black tracking-[-0.04em] text-ink sm:text-2xl">{formatPrice(product.price)}</p>
          {product.installments && product.installment_price ? <p className="mt-0.5 text-[0.65rem] font-bold text-forest/70 sm:text-xs">o {product.installments} pagos de {formatPrice(product.installment_price)}</p> : <p className="mt-0.5 text-[0.65rem] font-bold text-forest/70 sm:text-xs">Precio contado</p>}
        </div>
        <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-4">
          <Link href={`/producto/${product.slug}`} className="focus-ring inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-cream px-2 text-[0.7rem] font-extrabold text-ink transition hover:bg-sand sm:text-xs">
            Ver producto <ArrowUpRight size={14} />
          </Link>
          <AddToCartButton product={cartProduct} compact disabled={!canAddToCart} />
          <a href={generateWhatsAppLink({ phone, product, baseUrl })} target="_blank" rel="noreferrer" className="focus-ring grid size-10 place-items-center rounded-xl bg-[#167a40] text-white transition hover:bg-[#106332]" aria-label={`${isSoldOut ? "Consultar disponibilidad" : "Consultar"} por ${product.name}`} title={isSoldOut ? "Consultar disponibilidad" : "Consultar"}>
            <MessageCircle size={17} aria-hidden="true" />
          </a>
        </div>
        {isSoldOut ? <p className="mt-2 text-center text-[0.64rem] font-bold text-clay">{STATUS_LABELS[product.status]}</p> : null}
      </div>
    </article>
  );
}
