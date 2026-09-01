import { describe, expect, it } from "vitest";
import { safeImageName, validateImageMetadata } from "@/lib/admin-api/uploads";

describe("validación de archivos", () => {
  it("rechaza ejecutables disfrazados de imagen", () => {
    expect(() => validateImageMetadata({
      name: "producto.jpg",
      type: "image/jpeg",
      size: 128,
      bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
    })).toThrow();
  });

  it("rechaza extensiones que no coinciden con el MIME", () => {
    expect(() => validateImageMetadata({
      name: "producto.png",
      type: "image/jpeg",
      size: 128,
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0x00]),
    })).toThrow();
  });

  it("sanea nombres antes de generar la ruta", () => {
    expect(safeImageName("Mi Producto (frente) 2026.webp")).toBe("mi-producto-frente-2026");
  });
});

