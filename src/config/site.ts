import type { SiteSettings } from "@/types";

export const FALLBACK_SETTINGS: SiteSettings = {
  storeName: "ORQELIS",
  whatsappNumber:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    "541155912747",
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    "https://instagram.com/seba.r.z",
  shippingText:
    "También realizamos envíos a todo Argentina. Consultanos por WhatsApp indicando tu localidad para calcular costo y modalidad de envío.",
  deliveryText:
    "Entregas de un día para el otro, sujetas a disponibilidad y coordinación previa.",
  email: "",
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://orqelis-flame.vercel.app";

export const DELIVERY_POINTS = [
  ["Lomas de Zamora", "Estación"],
  ["Ranelagh", "Estación"],
  ["Banfield", "Estación"],
  ["Claypole", "Estación"],
  ["José Mármol", "Estación"],
  ["Rafael Calzada", "Estación"],
  ["Florencio Varela", "Estación / Cruce Varela"],
  ["Quilmes", "Mostaza / Jumbo"],
  ["Wilde", "Estación / Mitre y Las Flores"],
  ["Villa Domínico", "Parque Domínico"],
  ["Sarandí", "Coto / Pasteur y Mitre / Colegio San Patricio"],
  ["Lanús", "Estación / Municipalidad"],
  ["Avellaneda", "Plaza Alsina / Alto Avellaneda"],
  ["Berazategui", "Estación / Paseo de la Memoria"],
  ["Bernal", "Estación"],
  ["San Francisco Solano", "Coppel"],
  ["Barracas", "Colegio Zaccaria / Farmacity Montes de Oca"],
  ["Constitución", "Estación"],
] as const;
