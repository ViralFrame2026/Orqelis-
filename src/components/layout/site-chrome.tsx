"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { SITE_URL } from "@/config/site";
import type { SiteSettings } from "@/types";

function SoftwareChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-ink/8">
        <div className="container-store flex h-[4.75rem] items-center justify-between gap-5">
          <Link href="/" className="focus-ring rounded-xl" aria-label="ORQELIS — inicio">
            <span className="font-display text-xl font-black tracking-[0.12em] text-ink">ORQELIS</span>
            <span className="ml-3 hidden text-[.62rem] font-black uppercase tracking-[.18em] text-clay sm:inline">Software para comercios</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="ORQELIS Software">
            <Link href="/#solucion" className="text-sm font-bold text-ink/65 hover:text-clay">Solución</Link>
            <Link href="/#ia" className="text-sm font-bold text-ink/65 hover:text-clay">IA</Link>
            <Link href="/demo" className="text-sm font-bold text-ink/65 hover:text-clay">Ver demo</Link>
          </nav>
          <Link href="/#contacto" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-forest">
            Quiero ORQELIS <ArrowRight size={16} />
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-ink/8 bg-[#fffaf5] py-8">
        <div className="container-store flex flex-col gap-4 text-sm text-ink/55 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="font-display font-black tracking-[.1em] text-ink">ORQELIS</span><span className="ml-3">Tienda · Admin · IA</span></div>
          <div className="flex items-center gap-5"><Link href="/demo" className="hover:text-clay">Demo</Link><Link href="/admin" className="hover:text-clay">Panel</Link><span>Pedís. ORQELIS lo hace.</span></div>
        </div>
      </footer>
    </>
  );
}

export function SiteChrome({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isSoftwareLanding = pathname === "/";

  if (isAdmin) return <>{children}</>;
  if (isSoftwareLanding) return <SoftwareChrome>{children}</SoftwareChrome>;

  return (
    <CartProvider>
      <Header settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
      <WhatsAppFloat phone={settings.whatsappNumber} />
      <CartDrawer phone={settings.whatsappNumber} baseUrl={SITE_URL} />
    </CartProvider>
  );
}
