import { describe, expect, it } from "vitest";
import { createProductSchema, patchProductSchema } from "@/lib/admin-api/schemas";

const validProduct = {
  name: "Termo de prueba",
  category: "termos-y-mates",
  short_description: "Descripción breve",
  description: "Descripción completa",
  price: "55.000",
  status: "published",
};

describe("creación y edición de productos", () => {
  it("normaliza una creación procedente de IA sin inventar datos comerciales", () => {
    const product = createProductSchema.parse(validProduct);
    expect(product.price).toBe(55_000);
    expect(product.status).toBe("available");
    expect(product.stock).toBeNull();
    expect(product.installments).toBeNull();
    expect(product.sku).toBeNull();
  });

  it("acepta una edición verdaderamente parcial", () => {
    expect(patchProductSchema.parse({ price: "58.000", offer: "sí" })).toEqual({
      price: 58_000,
      offer: true,
    });
  });

  it.each([-1, "-1", "precio desconocido", "12.34.5"])("rechaza el precio inválido %s", (price) => {
    expect(() => createProductSchema.parse({ ...validProduct, price })).toThrow();
  });
});

