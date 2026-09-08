import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Truck } from "lucide-react";
import { Benefits } from "@/components/home/benefits";
import { Hero } from "@/components/home/hero";
import { WhatsAppCta } from "@/components/home/whatsapp-cta";
import { CategoryGrid } from "@/components/store/category-grid";
import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { SITE_URL } from "@/config/site";
import { DEMO_PRODUCTS } from "@/data/demo";
import { getCategories, getProducts } from "@/services/catalog";
import { getSiteSettings } from "@/services/settings";

export const metadata = { title: "Demo de tienda ORQELIS", description: "Demo funcional de una tienda creada y administrada con ORQELIS." };

export default async function DemoPage() {
  const [products, categories, settings] = await Promise.all([getProducts(), getCategories(), getSiteSettings()]);
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const offers = products.filter((product) => product.offer).slice(0, 4);
  const heroProduct = featured[0] || products[0] || DEMO_PRODUCTS[0];
  const categoriesWithOfferCount = categories.map((category) => category.slug === "ofertas" ? { ...category, product_count: products.filter((product) => product.offer).length } : category);
  return <>
    <div className="bg-clay px-4 py-2 text-center text-xs font-extrabold text-white">DEMO ORQELIS · Esta tienda es una demostración del sistema <Link href="/" className="ml-2 underline">Conocer ORQELIS</Link></div>
    <Hero product={heroProduct} phone={settings.whatsappNumber} />
    <section id="categorias" className="container-store scroll-mt-28 py-16 sm:py-24"><div className="mb-8 flex items-end justify-between gap-5"><SectionHeading eyebrow="Explorá por categoría" title="¿Qué estás buscando?" description="Una muestra real de la experiencia de compra que ORQELIS puede ofrecer a tus clientes." /><Link href="/productos" className="hidden text-sm font-extrabold text-clay sm:inline-flex">Ver todo <ArrowRight size={17}/></Link></div><CategoryGrid categories={categoriesWithOfferCount}/></section>
    <section className="bg-cream py-16 sm:py-24"><div className="container-store"><SectionHeading eyebrow="Demo de catálogo" title="Productos destacados" description="Productos de muestra publicados desde el sistema ORQELIS."/><div className="mt-8"><ProductGrid products={featured} phone={settings.whatsappNumber} baseUrl={SITE_URL} emptyMessage="Sin productos destacados."/></div></div></section>
    <section className="container-store py-16 sm:py-24"><SectionHeading eyebrow="Precio especial" title="Ofertas" description="Ejemplo de promociones administrables desde ORQELIS."/><div className="mt-8"><ProductGrid products={offers} phone={settings.whatsappNumber} baseUrl={SITE_URL} emptyMessage="Sin ofertas activas."/></div></section>
    <section className="container-store pb-16 sm:pb-24"><SectionHeading eyebrow="Experiencia de compra" title="Fácil desde que preguntás hasta que lo recibís" align="center"/><div className="mt-9"><Benefits/></div></section>
    <section className="overflow-hidden bg-forest text-white"><div className="container-store grid items-stretch lg:grid-cols-2"><div className="flex flex-col justify-center py-14 lg:pr-14"><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-sand"><Clock3 size={23}/></span><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-sand">Configurable para cada comercio</p><h2 className="font-display mt-3 text-4xl">Entregas y logística a tu manera</h2><p className="mt-4 text-white/65">Cada implementación puede adaptar zonas, envíos, medios de contacto y condiciones del negocio.</p></div><div className="relative min-h-80"><Image src="/products/termo-detalle.svg" alt="Demo de producto ORQELIS" fill className="object-cover"/><div className="absolute bottom-6 left-6 rounded-2xl bg-paper/94 p-5 text-ink"><div className="flex gap-3"><MapPin className="text-clay"/><div><p className="font-extrabold">Tu operación, configurada</p><p className="text-xs text-ink/55">Local, regional o nacional.</p></div></div></div></div></div></section>
    <section className="container-store py-16"><div className="rounded-[2rem] bg-sand/45 p-8 sm:p-12"><div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center"><span className="grid size-14 place-items-center rounded-2xl bg-clay text-white"><Truck/></span><div><p className="text-xs font-black uppercase tracking-[.2em] text-clay">¿Querés una tienda así?</p><h2 className="font-display mt-2 text-3xl">Implementá ORQELIS en tu negocio</h2><p className="mt-2 text-ink/62">Tienda, administración y automatización con IA en un mismo sistema.</p></div><Link href="/#contacto" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-extrabold text-white">Quiero ORQELIS <ArrowRight size={17}/></Link></div></div></section>
    <WhatsAppCta phone={settings.whatsappNumber}/>
  </>;
}
