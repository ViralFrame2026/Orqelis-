import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Send, Truck } from "lucide-react";
import { InstagramMark } from "@/components/ui/instagram-mark";
import { getSiteSettings } from "@/services/settings";
import { generateWhatsAppLink } from "@/utils/whatsapp";

export const metadata: Metadata = { title: "Contacto", description: "Escribinos por WhatsApp o Instagram para consultar productos, entregas y envíos." };

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <div className="container-store py-10 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-clay">Hablemos</p><h1 className="font-display text-balance mt-3 text-4xl leading-tight sm:text-6xl">Una respuesta humana, sin vueltas.</h1><p className="mt-5 max-w-xl text-base leading-7 text-ink/60">Contanos qué producto te interesa, dónde estás y cómo preferís recibirlo. Te respondemos con disponibilidad y opciones.</p></div>
        <div className="grid gap-4">
          <a href={generateWhatsAppLink({ phone: settings.whatsappNumber })} target="_blank" rel="noreferrer" className="focus-ring group flex items-center gap-5 rounded-[1.6rem] bg-[#167a40] p-6 text-white transition hover:-translate-y-0.5 sm:p-8"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15"><MessageCircle size={27} fill="currentColor" /></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-white/65">Canal principal</p><h2 className="mt-1 text-xl font-extrabold">Consultar por WhatsApp</h2><p className="mt-1 text-sm text-white/68">Productos, stock, pagos y entregas.</p></div><Send className="ml-auto hidden transition group-hover:translate-x-1 sm:block" /></a>
          <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="focus-ring group flex items-center gap-5 rounded-[1.6rem] border border-ink/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-clay/25 sm:p-8"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sand/55 text-clay"><InstagramMark size={27} /></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-clay">Novedades</p><h2 className="mt-1 text-xl font-extrabold">Seguinos en Instagram</h2><p className="mt-1 text-sm text-ink/52">Ingresos, ofertas e ideas para regalar.</p></div></a>
          {settings.email ? <a href={`mailto:${settings.email}`} className="focus-ring flex items-center gap-5 rounded-[1.6rem] border border-ink/10 bg-white p-6 sm:p-8"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sage text-forest"><Mail size={25} /></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-forest">Email</p><h2 className="mt-1 text-lg font-extrabold">{settings.email}</h2></div></a> : null}
        </div>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[1.4rem] bg-cream p-6"><MapPin className="text-clay" /><h2 className="mt-4 font-extrabold">Zona Sur + CABA</h2><p className="mt-2 text-sm leading-6 text-ink/55">Más de 18 puntos de entrega para coordinar.</p></div>
        <div className="rounded-[1.4rem] bg-cream p-6"><Truck className="text-clay" /><h2 className="mt-4 font-extrabold">Envíos a todo el país</h2><p className="mt-2 text-sm leading-6 text-ink/55">Indicá tu localidad para calcular costo y modalidad.</p></div>
        <div className="rounded-[1.4rem] bg-cream p-6 sm:col-span-2 lg:col-span-1"><MessageCircle className="text-clay" /><h2 className="mt-4 font-extrabold">Atención personalizada</h2><p className="mt-2 text-sm leading-6 text-ink/55">Te ayudamos a elegir según lo que necesitás.</p></div>
      </div>
    </div>
  );
}
