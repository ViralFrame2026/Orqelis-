import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "@/lib/admin-api/errors";
import {
  downloadDriveImage,
  extractDriveFileId,
  loadGoogleCatalogSheet,
  mapCatalogRow,
  parseCatalogSheetText,
  parseCsv,
  parseGoogleSheetUrl,
} from "@/lib/admin-api/google-drive-import";

afterEach(() => vi.unstubAllGlobals());

describe("importador de Google Drive", () => {
  it("interpreta CSV con comas, comillas y saltos de línea", () => {
    expect(parseCsv('nombre,descripcion\r\n"Mate, rojo","Línea 1\nLínea 2"')).toEqual([
      ["nombre", "descripcion"],
      ["Mate, rojo", "Línea 1\nLínea 2"],
    ]);
  });

  it("reconoce el enlace y la pestaña de Google Sheets", () => {
    expect(parseGoogleSheetUrl("https://docs.google.com/spreadsheets/d/abc_DEF-123/edit#gid=987")).toEqual({
      spreadsheetId: "abc_DEF-123",
      gid: "987",
    });
  });

  it("mapea columnas en español y listas separadas por barra", () => {
    const [row] = parseCatalogSheetText([
      "nombre,categoria,descripcion_corta,descripcion,precio,estado,etiquetas,caracteristicas,imagenes_drive",
      'Mate térmico,Mates,Ideal para viajes,"Acero, doble pared",25.000,oculto,nuevo|regalo,Acero|500 ml,https://drive.google.com/file/d/1234567890abcdef/view',
    ].join("\n"));
    const mapped = mapCatalogRow(row);
    expect(mapped.candidate).toMatchObject({
      name: "Mate térmico",
      category: "Mates",
      price: "25.000",
      status: "oculto",
      tags: ["nuevo", "regalo"],
      features: ["Acero", "500 ml"],
    });
    expect(mapped.driveImageUrls).toHaveLength(1);
  });

  it("acepta archivos de Drive y rechaza carpetas", () => {
    expect(extractDriveFileId("https://drive.google.com/file/d/1234567890abcdef/view?usp=sharing"))
      .toBe("1234567890abcdef");
    expect(() => extractDriveFileId("https://drive.google.com/drive/folders/1234567890abcdef"))
      .toThrowError(AdminApiError);
  });

  it("lee una planilla pública y calcula una huella estable", async () => {
    const csv = "nombre,categoria,descripcion_corta,descripcion,precio,estado\nMate,Mates,Breve,Completa,10000,hidden";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(csv, {
      status: 200,
      headers: { "content-type": "text/csv" },
    })));
    const sheet = await loadGoogleCatalogSheet("https://docs.google.com/spreadsheets/d/abc_DEF-123/edit");
    expect(sheet.rows).toHaveLength(1);
    expect(sheet.sheetHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("descarga y valida una imagen pública antes de crear el archivo", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(png, {
      status: 200,
      headers: { "content-type": "image/png" },
    })));
    const file = await downloadDriveImage(
      "https://drive.google.com/file/d/1234567890abcdef/view",
      0,
    );
    expect(file.type).toBe("image/png");
    expect(file.name).toMatch(/\.png$/);
    expect(file.size).toBe(png.byteLength);
  });
});
