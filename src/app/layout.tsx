import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SITE_URL } from "@/config/site";
import { getSiteSettings } from "@/services/settings";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ORQELIS | Comercio digital administrado con IA",
    template: "%s | ORQELIS",
  },
  description:
    "Tienda online, panel de administración y un asistente de IA que ejecuta tareas sobre tu negocio.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "ORQELIS",
    title: "ORQELIS | Pedís. ORQELIS lo hace.",
    description:
      "Tienda online, administración y automatización con IA para comercios. Menos tiempo administrando. Más tiempo vendiendo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORQELIS | Comercio digital con IA",
    description:
      "Tienda, panel de administración y un asistente de IA que ejecuta tareas sobre tu negocio.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2b211e",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  return (
    <html lang="es" className={nunito.variable}>
      <body>
        <SiteChrome settings={settings}>{children}</SiteChrome>
      </body>
    </html>
  );
}
