"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { SITE_URL } from "@/config/site";
import type { SiteSettings } from "@/types";

export function SiteChrome({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
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
