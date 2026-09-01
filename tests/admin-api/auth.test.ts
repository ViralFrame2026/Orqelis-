import { afterEach, describe, expect, it } from "vitest";
import { authenticateAdminRequest, readBearerToken, tokensMatch } from "@/lib/admin-api/auth";
import { AdminApiError } from "@/lib/admin-api/errors";

const originalKey = process.env.ORQELIS_ADMIN_API_KEY;
const originalChatGptKey = process.env.ORQELIS_CHATGPT_API_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.ORQELIS_ADMIN_API_KEY;
  else process.env.ORQELIS_ADMIN_API_KEY = originalKey;
  if (originalChatGptKey === undefined) delete process.env.ORQELIS_CHATGPT_API_KEY;
  else process.env.ORQELIS_CHATGPT_API_KEY = originalChatGptKey;
});

describe("autenticación administrativa", () => {
  it("rechaza una credencial inválida", () => {
    process.env.ORQELIS_ADMIN_API_KEY = "a".repeat(48);
    const request = new Request("http://localhost/api/v1/admin/products", {
      headers: { Authorization: `Bearer ${"b".repeat(48)}` },
    });
    expect(() => authenticateAdminRequest(request)).toThrowError(AdminApiError);
    try {
      authenticateAdminRequest(request);
    } catch (error) {
      expect((error as AdminApiError).status).toBe(401);
      expect((error as AdminApiError).code).toBe("UNAUTHORIZED");
    }
  });

  it("acepta únicamente el formato Bearer y compara el valor completo", () => {
    expect(readBearerToken("Basic abc")).toBeNull();
    expect(readBearerToken("Bearer token-seguro")).toBe("token-seguro");
    expect(tokensMatch("token-seguro", "token-seguro")).toBe(true);
    expect(tokensMatch("token-seguro", "token-distinto")).toBe(false);
  });

  it("identifica una credencial exclusiva de ChatGPT como origen IA", () => {
    process.env.ORQELIS_ADMIN_API_KEY = "a".repeat(48);
    process.env.ORQELIS_CHATGPT_API_KEY = "c".repeat(48);
    const request = new Request("http://localhost/api/v1/admin/products", {
      headers: { Authorization: `Bearer ${"c".repeat(48)}` },
    });
    expect(authenticateAdminRequest(request)).toMatchObject({ source: "ai" });
  });
});
