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
    default: "ORQELIS | Casa, bazar y regalos",
    template: "%s | ORQELIS",
  },
  description:
    "Electro, bazar, hogar, termos, mates y productos personalizados. Entregas en Zona Sur y envíos a todo el país.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "ORQELIS",
    title: "ORQELIS | Objetos que hacen hogar",
    description:
      "Encontrá productos para tu casa, regalos y tecnología con entrega rápida y atención por WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORQELIS",
    description: "Electro, bazar, hogar y mucho más.",
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
