import type { CartItem } from "@/types";
import { formatPrice } from "@/utils/format";

export const CART_STORAGE_KEY = "orqelis-cart-v1";
export const MAX_CART_ITEMS = 30;
export const MAX_CART_QUANTITY = 99;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.name === "string" &&
    item.name.length > 0 &&
    typeof item.slug === "string" &&
    item.slug.length > 0 &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    typeof item.image_url === "string" &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

export function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const uniqueItems = new Map<string, CartItem>();

  for (const candidate of value) {
    if (!isCartItem(candidate) || uniqueItems.size >= MAX_CART_ITEMS) continue;
    uniqueItems.set(candidate.id, {
      id: candidate.id,
      name: candidate.name.slice(0, 200),
      slug: candidate.slug.slice(0, 200),
      price: candidate.price,
      image_url: candidate.image_url.slice(0, 2_000),
      quantity: Math.min(candidate.quantity, MAX_CART_QUANTITY),
    });
  }

  return [...uniqueItems.values()];
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function generateCartWhatsAppMessage(items: CartItem[], baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const productLines = items.flatMap((item, index) => [
    `${index + 1}. ${item.name}`,
    `   Cantidad: ${item.quantity}`,
    `   Precio unitario: ${formatPrice(item.price)}`,
    `   Subtotal: ${formatPrice(item.price * item.quantity)}`,
    `   ${cleanBaseUrl}/producto/${item.slug}`,
    "",
  ]);

  return [
    "Hola 👋 Quería consultar por este carrito de ORQELIS:",
    "",
    ...productLines,
    `Total estimado: ${formatPrice(calculateCartTotal(items))}`,
    "",
    "¿Me confirmás disponibilidad y opciones de entrega o envío?",
  ].join("\n");
}
