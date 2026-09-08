import type { Metadata } from "next";
import { Clock3, MapPin, MessageCircle, Navigation, PackageCheck, Truck } from "lucide-react";
import { DELIVERY_POINTS } from "@/config/site";
import { getSiteSettings } from "@/services/settings";
import { generateWhatsAppLink } from "@/utils/whatsapp";

export const metadata: Metadata = { title: "Puntos de entrega", description: "Conocé nuestros puntos de entrega en Zona Sur y CABA, o pedí envío a cualquier punto del país." };

export default async function DeliveriesPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <section className="bg-cream py-12 sm:py-20"><div className="container-store grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-clay">Cerca tuyo</p><h1 className="font-display text-balance mt-3 text-4xl leading-tight sm:text-6xl">Puntos de entrega</h1><p className="mt-4 max-w-2xl text-base leading-7 text-ink/60">Coordinamos el día, horario y punto por WhatsApp. Elegí la opción más cómoda o consultanos por otro lugar.</p></div><a href={generateWhatsAppLink({ phone: settings.whatsappNumber, message: "Hola 👋 Quería coordinar un punto de entrega." })} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-6 text-sm font-extrabold text-white"><MessageCircle size={19} /> Coordinar entrega</a></div></section>
      <section className="container-store py-12 sm:py-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DELIVERY_POINTS.map(([place, detail], index) => <article key={place} className="group flex min-h-32 items-start gap-4 rounded-[1.35rem] border border-ink/8 bg-white p-5 transition hover:border-clay/25 hover:shadow-lg"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${index % 3 === 0 ? "bg-sand/60 text-clay-dark" : "bg-sage text-forest"}`}><MapPin size={19} /></span><div><h2 className="font-extrabold">{place}</h2><p className="mt-1.5 text-sm leading-5 text-ink/52">{detail}</p></div></article>)}
          <article className="flex min-h-32 items-start gap-4 rounded-[1.35rem] bg-clay p-5 text-white"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15"><Navigation size={19} /></span><div><h2 className="font-extrabold">Otros puntos a coordinar</h2><p className="mt-1.5 text-sm leading-5 text-white/68">Decinos dónde estás y buscamos una alternativa.</p></div></article>
        </div>
      </section>
      <section className="container-store pb-16 sm:pb-24"><div className="grid overflow-hidden rounded-[1.8rem] border border-ink/8 bg-cream sm:grid-cols-3">
        <div className="p-6 sm:p-8"><Clock3 className="text-clay" /><h2 className="mt-4 font-extrabold">Entregas rápidas</h2><p className="mt-2 text-sm leading-6 text-ink/55">De un día para el otro, sujeto a disponibilidad y coordinación.</p></div>
        <div className="border-y border-ink/8 p-6 sm:border-x sm:border-y-0 sm:p-8"><PackageCheck className="text-clay" /><h2 className="mt-4 font-extrabold">Punto confirmado</h2><p className="mt-2 text-sm leading-6 text-ink/55">Siempre coordinamos los detalles antes de salir.</p></div>
        <div className="p-6 sm:p-8"><Truck className="text-clay" /><h2 className="mt-4 font-extrabold">Envíos nacionales</h2><p className="mt-2 text-sm leading-6 text-ink/55">También llegamos a todo el país. Pedinos una cotización.</p></div>
      </div></section>
    </div>
  );
}
