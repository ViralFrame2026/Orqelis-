import { describe, expect, it } from "vitest";
import { findDuplicateSignals } from "@/services/admin-products";

const candidates = [
  { id: "1", name: "Termo Clásico 1.2 L", slug: "termo-clasico", sku: "ABC-10" },
];

describe("protección contra duplicados", () => {
  it("detecta slug y SKU exactos", () => {
    const result = findDuplicateSignals(candidates, {
      name: "Otro producto",
      slug: "termo-clasico",
      sku: "abc-10",
    });
    expect(result.slugConflict?.id).toBe("1");
    expect(result.skuConflict?.id).toBe("1");
  });

  it("solo advierte ante un nombre normalizado coincidente", () => {
    const result = findDuplicateSignals(candidates, {
      name: "  TERMO clasico 1.2 l ",
      slug: "otra-variante",
      sku: null,
    });
    expect(result.slugConflict).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
  });
});

