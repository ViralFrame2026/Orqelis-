import Link from "next/link";
import { MessageCircle, Truck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { InstagramMark } from "@/components/ui/instagram-mark";
import type { SiteSettings } from "@/types";
import { generateWhatsAppLink } from "@/utils/whatsapp";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-ink pb-28 pt-14 text-white sm:pb-12">
      <div className="container-store">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo light />
            <p className="mt-5 text-sm leading-6 text-white/62">Objetos elegidos con calidez para tu casa, tus regalos y esos momentos de todos los días.</p>
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-sand">Comprar</h2>
            <div className="mt-4 grid gap-3 text-sm text-white/68">
              <Link href="/productos" className="hover:text-white">Productos</Link>
              <Link href="/ofertas" className="hover:text-white">Ofertas</Link>
              <Link href="/#categorias" className="hover:text-white">Categorías</Link>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-sand">Ayuda</h2>
            <div className="mt-4 grid gap-3 text-sm text-white/68">
              <Link href="/entregas" className="hover:text-white">Puntos de entrega</Link>
              <Link href="/contacto" className="hover:text-white">Contacto</Link>
              <span className="inline-flex items-center gap-2"><Truck size={16} /> Envíos nacionales</span>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-sand">Hablemos</h2>
            <div className="mt-4 grid gap-3 text-sm text-white/68">
              <a href={generateWhatsAppLink({ phone: settings.whatsappNumber })} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MessageCircle size={16} /> WhatsApp</a>
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><InstagramMark size={16} /> Instagram</a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.storeName}. Todos los derechos reservados.</p>
          <p>Todos los precios están sujetos a disponibilidad.</p>
        </div>
      </div>
    </footer>
  );
}
