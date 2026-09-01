"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Logo } from "@/components/layout/logo";
import { InstagramMark } from "@/components/ui/instagram-mark";
import type { SiteSettings } from "@/types";
import { generateWhatsAppLink } from "@/utils/whatsapp";

const links = [
  ["Inicio", "/"],
  ["Productos", "/productos"],
  ["Ofertas", "/ofertas"],
  ["Categorías", "/#categorias"],
  ["Entregas", "/entregas"],
  ["Contacto", "/contacto"],
] as const;

export function Header({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const { totalQuantity, openCart } = useCart();
  const whatsappUrl = generateWhatsAppLink({ phone: settings.whatsappNumber });

  return (
    <header className="glass sticky top-0 z-50 border-b border-ink/8">
      <div className="container-store flex h-[4.75rem] items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegación principal">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="focus-ring rounded-md text-sm font-bold text-ink/70 transition hover:text-clay">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <button type="button" onClick={openCart} className="focus-ring relative grid size-11 place-items-center rounded-full border border-ink/10 text-ink transition hover:border-clay hover:text-clay" aria-label={`Abrir carrito${totalQuantity ? `, ${totalQuantity} productos` : ""}`}>
            <ShoppingBag size={19} aria-hidden="true" />
            {totalQuantity ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[0.58rem] font-black text-white">{totalQuantity}</span> : null}
          </button>
          <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="focus-ring grid size-11 place-items-center rounded-full border border-ink/10 text-ink transition hover:border-clay hover:text-clay" aria-label="Visitar Instagram">
            <InstagramMark size={19} />
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-forest">
            <MessageCircle size={18} aria-hidden="true" />
            Consultar por WhatsApp
          </a>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <button type="button" onClick={openCart} className="focus-ring relative grid size-11 place-items-center rounded-full border border-ink/10" aria-label={`Abrir carrito${totalQuantity ? `, ${totalQuantity} productos` : ""}`}>
            <ShoppingBag size={19} aria-hidden="true" />
            {totalQuantity ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[0.58rem] font-black text-white">{totalQuantity}</span> : null}
          </button>
          <button type="button" onClick={() => setOpen((value) => !value)} className="focus-ring grid size-11 place-items-center rounded-full border border-ink/10" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-menu" className="border-t border-ink/8 bg-paper px-4 pb-5 pt-3 sm:hidden">
          <nav className="container-store grid" aria-label="Navegación móvil">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="focus-ring rounded-xl border-b border-ink/6 px-2 py-3.5 text-base font-bold">
                {label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white">
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="focus-ring grid size-12 place-items-center rounded-xl bg-cream text-ink" aria-label="Instagram">
                <InstagramMark size={20} />
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
