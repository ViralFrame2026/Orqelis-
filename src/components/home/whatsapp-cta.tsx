import { ArrowUpRight, MessageCircle } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";

export function WhatsAppCta({ phone }: { phone: string }) {
  return (
    <section className="container-store py-16 sm:py-24">
      <div className="grid-fade relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-12 sm:py-14 lg:grid lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-clay/35 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-sand">Estamos para ayudarte</p>
          <h2 className="font-display text-balance mt-3 text-3xl leading-tight sm:text-5xl">¿No encontrás lo que buscás?</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/62 sm:text-base">Escribinos. Te contamos qué hay disponible, buscamos alternativas y coordinamos la entrega sin vueltas.</p>
        </div>
        <a href={generateWhatsAppLink({ phone, message: "Hola 👋 Estoy buscando un producto y quería saber si lo tienen disponible." })} target="_blank" rel="noreferrer" className="focus-ring relative mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-extrabold text-ink transition hover:bg-sand lg:mt-0"><MessageCircle size={19} /> Escribir ahora <ArrowUpRight size={17} /></a>
      </div>
    </section>
  );
}
