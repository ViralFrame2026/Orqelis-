import type { Product } from "@/types";
import { formatPrice } from "@/utils/format";

type WhatsAppOptions = {
  phone: string;
  product?: Pick<Product, "name" | "price" | "slug">;
  baseUrl?: string;
  message?: string;
};

export function generateWhatsAppLink({
  phone,
  product,
  baseUrl,
  message,
}: WhatsAppOptions): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const safePhone = cleanPhone.length >= 8 ? cleanPhone : "541155912747";
  const productUrl = product
    ? `${(baseUrl || "").replace(/\/$/, "")}/producto/${product.slug}`
    : "";

  const text = message
    ? message
    : product
      ? [
          "Hola 👋 Quería consultar por:",
          "",
          product.name,
          `Precio: ${formatPrice(product.price)}`,
          "",
          "¿Sigue disponible?",
          productUrl,
        ]
          .filter(Boolean)
          .join("\n")
      : "Hola 👋 Quería hacer una consulta sobre los productos de la tienda.";

  return `https://wa.me/${safePhone}?text=${encodeURIComponent(text)}`;
}
