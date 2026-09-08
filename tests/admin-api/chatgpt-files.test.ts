import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadChatGptImages,
  isAllowedChatGptFileUrl,
  normalizeChatGptFileReferences,
} from "@/lib/admin-api/chatgpt-files";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("archivos adjuntos de ChatGPT", () => {
  it("acepta referencias temporales con metadatos", () => {
    expect(normalizeChatGptFileReferences([{
      download_link: "https://files.oaiusercontent.com/file-test/image.png?sig=test",
      name: "Producto frente.png",
      mime_type: "image/png",
    }])).toEqual([{
      url: "https://files.oaiusercontent.com/file-test/image.png?sig=test",
      name: "Producto frente.png",
      mimeType: "image/png",
    }]);
  });

  it("rechaza hosts ajenos a OpenAI", () => {
    expect(isAllowedChatGptFileUrl("https://files.oaiusercontent.com/file-test/image.png")).toBe(true);
    expect(isAllowedChatGptFileUrl("http://files.oaiusercontent.com/file-test/image.png")).toBe(false);
    expect(isAllowedChatGptFileUrl("https://example.com/image.png")).toBe(false);
  });

  it("descarga una imagen válida y la convierte en File", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "attachment; filename=Producto.png",
      },
    })));

    const references = normalizeChatGptFileReferences([
      "https://files.oaiusercontent.com/file-test/image.png?sig=test",
    ]);
    const files = await downloadChatGptImages(references);

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ name: "producto.png", type: "image/png", size: png.byteLength });
  });
});
