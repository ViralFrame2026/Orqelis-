import { describe, expect, it } from "vitest";
import type { CartItem } from "@/types";
import { calculateCartTotal, generateCartWhatsAppMessage, normalizeCartItems } from "@/utils/cart";

const items: CartItem[] = [
  { id: "1", name: "Termo ORQELIS", slug: "termo-orqelis", price: 55_000, image_url: "/termo.jpg", quantity: 2 },
  { id: "2", name: "Mate personalizado", slug: "mate-personalizado", price: 12_000, image_url: "/mate.jpg", quantity: 1 },
];

describe("carrito", () => {
  it("calcula el total según las cantidades", () => {
    expect(calculateCartTotal(items)).toBe(122_000);
  });

  it("normaliza datos guardados y descarta entradas inválidas", () => {
    expect(normalizeCartItems([...items, { id: "inválido" }])).toEqual(items);
  });

  it("genera una consulta de WhatsApp con productos, cantidades y total", () => {
    const message = generateCartWhatsAppMessage(items, "https://orqelis-flame.vercel.app/");
    expect(message).toContain("Termo ORQELIS");
    expect(message).toContain("Cantidad: 2");
    expect(message).toContain("Total estimado: $ 122.000");
    expect(message).toContain("https://orqelis-flame.vercel.app/producto/mate-personalizado");
  });
});
