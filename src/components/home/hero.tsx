import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Sparkles } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/utils/format";
import { generateWhatsAppLink } from "@/utils/whatsapp";

export function Hero({ product, phone }: { product: Product; phone: string }) {
  return (
    <section className="relative overflow-hidden bg-cream pb-14 pt-8 sm:pb-20 sm:pt-14">
      <div className="absolute -right-28 top-[-8rem] size-[28rem] rounded-full bg-sand/55 blur-3xl" aria-hidden="true" />
      <div className="container-store relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-clay/15 bg-white/70 px-3 py-2 text-xs font-extrabold text-clay shadow-sm"><Sparkles size={14} aria-hidden="true" /> Selección ORQELIS</span>
          <h1 className="font-display text-balance mt-5 text-[2.85rem] font-extrabold leading-[.98] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.6rem]">Objetos que hacen <span className="text-clay">hogar.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink/62 sm:text-lg">Una selección cálida y práctica para tu casa, tus regalos y tu día a día. Entregas en Zona Sur y envíos a todo el país.</p>
          <div className="mt-7 grid gap-3 sm:flex">
            <Link href="/productos" className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-6 text-sm font-extrabold text-white transition hover:bg-forest">Ver productos <ArrowRight size={18} /></Link>
            <a href={generateWhatsAppLink({ phone })} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-ink/12 bg-white px-6 text-sm font-extrabold text-ink transition hover:border-clay/35"><MessageCircle size={18} /> Consultar por WhatsApp</a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-ink/58">
            {["Atención personalizada", "Compra sin vueltas", "Entrega coordinada"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded-full bg-sage text-forest"><Check size={12} strokeWidth={3} /></span>{item}</span>)}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[34rem] lg:ml-auto">
          <div className="absolute -left-3 top-12 z-10 rotate-[-7deg] rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-8"><p className="text-[.62rem] font-black uppercase tracking-[.16em] text-clay">Favorito</p><p className="mt-0.5 text-sm font-extrabold">Listo para regalar</p></div>
          <Link href={`/producto/${product.slug}`} className="focus-ring group block overflow-hidden rounded-[2rem] border-[6px] border-white bg-white shadow-[0_28px_70px_rgba(52,39,31,.18)]">
            <div className="relative aspect-[1/1.02] overflow-hidden rounded-[1.62rem] bg-sand">
              <Image src={product.images[0]?.image_url || "/products/placeholder.svg"} alt={product.name} fill sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" loading="eager" />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/92 p-4 backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-5">
                <div className="flex items-end justify-between gap-4"><div><p className="line-clamp-1 text-sm font-extrabold text-ink sm:text-base">{product.name}</p><p className="mt-1 text-xs font-semibold text-ink/52">{product.installments} pagos disponibles</p></div><p className="shrink-0 text-lg font-black tracking-[-.04em] text-clay sm:text-2xl">{formatPrice(product.price)}</p></div>
              </div>
            </div>
          </Link>
          <div className="absolute -bottom-5 -right-2 z-10 rotate-[4deg] rounded-2xl bg-forest px-4 py-3 text-white shadow-xl sm:-right-7"><p className="text-[.6rem] font-bold uppercase tracking-[.15em] text-white/60">Entrega rápida</p><p className="mt-0.5 text-sm font-extrabold">Zona Sur + envíos</p></div>
        </div>
      </div>
    </section>
  );
}
