import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, MapPin, MessageCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductGrid } from "@/components/store/product-grid";
import { ShareProduct } from "@/components/store/share-product";
import { InstagramMark } from "@/components/ui/instagram-mark";
import { SITE_URL } from "@/config/site";
import { getProductBySlug, getProducts } from "@/services/catalog";
import { getSiteSettings } from "@/services/settings";
import { formatPrice, STATUS_LABELS } from "@/utils/format";
import { generateWhatsAppLink } from "@/utils/whatsapp";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.short_description,
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: product.images[0]?.image_url ? [{ url: product.images[0].image_url, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings, products] = await Promise.all([getProductBySlug(slug), getSiteSettings(), getProducts()]);
  if (!product) notFound();
  const soldOut = product.status === "sold_out";
  const canAddToCart = ["available", "last_units"].includes(product.status);
  const related = products.filter((item) => item.id !== product.id && item.category_id === product.category_id).slice(0, 4);
  const whatsappUrl = generateWhatsAppLink({ phone: settings.whatsappNumber, product, baseUrl: SITE_URL });
  const cartProduct = { id: product.id, name: product.name, slug: product.slug, price: product.price, image_url: product.images[0]?.image_url || "/products/placeholder.svg" };

  return (
    <div className="container-store py-6 sm:py-10">
      <nav className="mb-6 flex items-center gap-1.5 overflow-hidden text-xs font-bold text-ink/46" aria-label="Migas de pan"><Link href="/">Inicio</Link><ChevronRight size={13} /><Link href={`/categoria/${product.category.slug}`}>{product.category.name}</Link><ChevronRight size={13} /><span className="truncate text-ink/70">{product.name}</span></nav>
      <div className="grid gap-9 lg:grid-cols-[1.08fr_.92fr] lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} />
        <section className="lg:py-3">
          <div className="flex flex-wrap gap-2">
            {product.offer ? <span className="rounded-full bg-clay px-3 py-1.5 text-[.65rem] font-black uppercase tracking-wider text-white">Oferta</span> : null}
            {product.is_new ? <span className="rounded-full bg-ink px-3 py-1.5 text-[.65rem] font-black uppercase tracking-wider text-white">Nuevo</span> : null}
            {product.featured ? <span className="rounded-full bg-sage px-3 py-1.5 text-[.65rem] font-black uppercase tracking-wider text-forest">Destacado</span> : null}
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.17em] text-clay">{product.category.name}</p>
          <h1 className="font-display text-balance mt-2 text-4xl leading-[1.05] tracking-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-base leading-7 text-ink/58">{product.short_description}</p>
          <div className="mt-7 border-y border-ink/10 py-6">
            {product.previous_price ? <p className="text-sm font-semibold text-ink/40 line-through">{formatPrice(product.previous_price)}</p> : null}
            <p className="text-4xl font-black tracking-[-.05em]">{formatPrice(product.price)}</p>
            {product.installments && product.installment_price ? <p className="mt-2 text-sm font-extrabold text-forest">o {product.installments} pagos de {formatPrice(product.installment_price)}</p> : <p className="mt-2 text-sm font-extrabold text-forest">Precio contado</p>}
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-extrabold"><span className={`size-2.5 rounded-full ${soldOut ? "bg-clay" : "bg-[#32a05e]"}`} />{STATUS_LABELS[product.status]}</div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <AddToCartButton product={cartProduct} openAfterAdd disabled={!canAddToCart} />
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#167a40] px-5 text-center text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(22,122,64,.18)] transition hover:bg-[#106332] sm:text-base"><MessageCircle size={21} fill="currentColor" />{soldOut ? "Consultar disponibilidad" : "Consultar este producto"}</a>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><ShareProduct title={product.name} /><a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="focus-ring grid size-11 place-items-center rounded-xl border border-ink/12 bg-white" aria-label="Ver Instagram"><InstagramMark size={18} /></a></div>
          <div className="mt-7 grid gap-3 rounded-[1.4rem] bg-cream p-5 text-sm">
            <p className="flex items-start gap-3"><PackageCheck className="mt-0.5 shrink-0 text-clay" size={19} /><span><strong className="block">Entrega coordinada</strong><span className="text-xs leading-5 text-ink/52">Sujeta a disponibilidad y coordinación previa.</span></span></p>
            <p className="flex items-start gap-3"><Truck className="mt-0.5 shrink-0 text-clay" size={19} /><span><strong className="block">Envíos a toda Argentina</strong><span className="text-xs leading-5 text-ink/52">Consultá costo indicando tu localidad.</span></span></p>
            <p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-clay" size={19} /><span><strong className="block">Atención personalizada</strong><span className="text-xs leading-5 text-ink/52">Te acompañamos antes y después de la compra.</span></span></p>
          </div>
        </section>
      </div>

      <section className="grid gap-9 border-t border-ink/10 py-14 sm:mt-12 sm:grid-cols-[1fr_.85fr] sm:py-20">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-clay">Sobre el producto</p><h2 className="font-display mt-3 text-3xl">Descripción</h2><div className="mt-5 whitespace-pre-line text-sm leading-7 text-ink/62 sm:text-base">{product.description}</div></div>
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-clay">Detalles</p><h2 className="font-display mt-3 text-3xl">Características</h2><ul className="mt-5 grid gap-3">{product.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm font-semibold text-ink/68"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage text-forest"><Check size={12} strokeWidth={3} /></span>{feature}</li>)}</ul></div>
      </section>

      <section className="rounded-[1.7rem] bg-forest px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-9">
        <div className="flex gap-4"><MapPin className="mt-1 shrink-0 text-sand" /><div><h2 className="font-display text-2xl">¿Cómo te lo entregamos?</h2><p className="mt-2 text-sm leading-6 text-white/62">Elegí un punto de encuentro o pedí envío a tu localidad.</p></div></div>
        <Link href="/entregas" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-extrabold text-ink sm:mt-0">Ver entregas</Link>
      </section>

      {related.length ? <section className="py-16 sm:py-24"><h2 className="font-display mb-8 text-3xl sm:text-4xl">También te puede gustar</h2><ProductGrid products={related} phone={settings.whatsappNumber} baseUrl={SITE_URL} /></section> : null}
    </div>
  );
}
