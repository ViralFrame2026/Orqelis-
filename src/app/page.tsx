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

export default async function HomePage() {
  const [products, categories, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    getSiteSettings(),
  ]);
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const offers = products.filter((product) => product.offer).slice(0, 4);
  const heroProduct = featured[0] || products[0] || DEMO_PRODUCTS[0];
  const categoriesWithOfferCount = categories.map((category) =>
    category.slug === "ofertas"
      ? { ...category, product_count: products.filter((product) => product.offer).length }
      : category,
  );

  return (
    <>
      <Hero product={heroProduct} phone={settings.whatsappNumber} />

      <section id="categorias" className="container-store scroll-mt-28 py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-5">
          <SectionHeading eyebrow="Explorá por categoría" title="¿Qué estás buscando?" description="Entrá directo a lo que necesitás. Simple, rápido y sin perderte entre cientos de opciones." />
          <Link href="/productos" className="focus-ring hidden shrink-0 items-center gap-2 rounded-lg text-sm font-extrabold text-clay sm:inline-flex">Ver todo <ArrowRight size={17} /></Link>
        </div>
        <CategoryGrid categories={categoriesWithOfferCount} />
      </section>

      <section className="bg-cream py-16 sm:py-24">
        <div className="container-store">
          <div className="mb-8 flex items-end justify-between gap-5">
            <SectionHeading eyebrow="Elegidos para vos" title="Productos destacados" description="Los más buscados, las novedades y esas oportunidades que vale la pena mirar." />
            <Link href="/productos" className="focus-ring hidden shrink-0 items-center gap-2 rounded-lg text-sm font-extrabold text-clay sm:inline-flex">Ver catálogo <ArrowRight size={17} /></Link>
          </div>
          <ProductGrid products={featured} phone={settings.whatsappNumber} baseUrl={SITE_URL} emptyMessage="Marcá productos como destacados desde el panel administrador." />
        </div>
      </section>

      <section className="container-store py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-5">
          <SectionHeading eyebrow="Precio especial" title="Ofertas que no duran para siempre" description="Aprovechá valores promocionales sujetos a stock disponible." />
          <Link href="/ofertas" className="focus-ring hidden shrink-0 items-center gap-2 rounded-lg text-sm font-extrabold text-clay sm:inline-flex">Todas las ofertas <ArrowRight size={17} /></Link>
        </div>
        <ProductGrid products={offers} phone={settings.whatsappNumber} baseUrl={SITE_URL} emptyMessage="Marcá productos como oferta desde el panel administrador." />
      </section>

      <section className="container-store pb-16 sm:pb-24">
        <SectionHeading eyebrow="Comprar con tranquilidad" title="Fácil desde que preguntás hasta que lo recibís" align="center" />
        <div className="mt-9"><Benefits /></div>
      </section>

      <section className="overflow-hidden bg-forest text-white">
        <div className="container-store grid items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center py-14 pr-0 sm:py-20 lg:pr-14">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-sand"><Clock3 size={23} /></span>
            <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-sand">Cuando lo necesitás</p>
            <h2 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">Entregas de un día para el otro</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/65 sm:text-base">Coordinamos por WhatsApp el punto y horario. Sujeto a disponibilidad y coordinación previa.</p>
            <Link href="/entregas" className="focus-ring mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-ink">Ver puntos de entrega <ArrowRight size={17} /></Link>
          </div>
          <div className="relative min-h-80 overflow-hidden lg:min-h-full">
            <Image src="/products/termo-detalle.svg" alt="Detalle de un producto personalizado" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-forest/45 to-transparent lg:from-forest/75" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-paper/94 p-5 text-ink shadow-xl backdrop-blur sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-sm">
              <div className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-clay" size={21} /><div><p className="font-extrabold">Más de 18 puntos</p><p className="mt-1 text-xs leading-5 text-ink/55">Zona Sur y CABA. También coordinamos otros puntos.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-store py-16 sm:py-24">
        <div className="rounded-[2rem] border border-clay/15 bg-sand/45 px-6 py-10 sm:px-12 sm:py-12">
          <div className="grid gap-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-clay text-white"><Truck size={27} /></span>
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-clay">Llegamos más lejos</p><h2 className="font-display mt-2 text-3xl sm:text-4xl">Envíos a todo el país</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/62">{settings.shippingText}</p></div>
            <Link href="/contacto" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white">Calcular envío <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <WhatsAppCta phone={settings.whatsappNumber} />
    </>
  );
}
