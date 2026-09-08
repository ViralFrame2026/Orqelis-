import { describe, expect, it } from "vitest";
import {
  buildBulkStoragePath,
  isSafeBulkStoragePath,
  matchBulkImageFilenames,
  normalizeImageFilename,
  validateBulkImageDescriptor,
} from "@/lib/admin-api/bulk-image-import";

const PRODUCT_ID = "20000000-0000-4000-8000-000000000001";
const UPLOAD_ID = "3572c5e7-6669-46c2-a3c5-235cacb0dc3a";

describe("importación masiva de imágenes", () => {
  it("usa solamente el nombre original como clave y no la carpeta del ZIP", () => {
    expect(normalizeImageFilename("proveedor\\AGOSTO/IMG-001.JPG")).toBe("img-001.jpg");
  });

  it("asocia únicamente coincidencias exactas y no crea productos", () => {
    const result = matchBulkImageFilenames(
      ["IMG-001.JPG", "IMG-002.png"],
      [{ productId: PRODUCT_ID, productName: "Termo", imageFilename: "img-001.jpg" }],
    );
    expect(result[0]).toMatchObject({ status: "matched", productId: PRODUCT_ID });
    expect(result[1]).toMatchObject({ status: "unmatched" });
    expect(result[1]).not.toHaveProperty("productId");
  });

  it("bloquea nombres duplicados aunque estén en carpetas distintas", () => {
    const result = matchBulkImageFilenames(
      ["uno/imagen.webp", "dos/IMAGEN.WEBP"],
      [{ productId: PRODUCT_ID, productName: "Termo", imageFilename: "imagen.webp" }],
    );
    expect(result.every(({ status }) => status === "duplicate")).toBe(true);
  });

  it("valida formato, tipo MIME y tamaño antes de subir", () => {
    expect(validateBulkImageDescriptor({ filename: "foto.jpeg", type: "image/jpeg", size: 1024 }))
      .toMatchObject({ extension: "jpeg", expectedType: "image/jpeg" });
    expect(() => validateBulkImageDescriptor({ filename: "foto.png", type: "image/jpeg", size: 1024 }))
      .toThrow("La extensión no coincide");
    expect(() => validateBulkImageDescriptor({ filename: "foto.exe", type: "image/jpeg", size: 1024 }))
      .toThrow("Solo se aceptan");
  });

  it("solo acepta para finalizar la ruta única preparada para ese producto", () => {
    const path = buildBulkStoragePath(PRODUCT_ID, "Foto producto.JPG", UPLOAD_ID);
    expect(path).toBe(`${PRODUCT_ID}/bulk/${UPLOAD_ID}-foto-producto.jpg`);
    expect(isSafeBulkStoragePath(PRODUCT_ID, "Foto producto.JPG", path)).toBe(true);
    expect(isSafeBulkStoragePath("10000000-0000-4000-8000-000000000001", "Foto producto.JPG", path)).toBe(false);
  });
});
