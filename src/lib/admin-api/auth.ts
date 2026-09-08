import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { AdminApiError } from "@/lib/admin-api/errors";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function tokensMatch(provided: string, expected: string) {
  return timingSafeEqual(digest(provided), digest(expected));
}

export function readBearerToken(authorization: string | null) {
  if (!authorization) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

export function authenticateAdminRequest(request: Request) {
  const expectedAdmin = process.env.ORQELIS_ADMIN_API_KEY?.trim();
  const expectedChatGpt = process.env.ORQELIS_CHATGPT_API_KEY?.trim();
  if (!expectedAdmin) {
    throw new AdminApiError(
      503,
      "SERVER_MISCONFIGURED",
      "La autenticación administrativa todavía no está configurada.",
    );
  }

  const provided = readBearerToken(request.headers.get("authorization"));
  if (!provided) {
    throw new AdminApiError(
      401,
      "UNAUTHORIZED",
      "La credencial administrativa no es válida.",
    );
  }
  if (expectedChatGpt && tokensMatch(provided, expectedChatGpt)) {
    return { token: provided, source: "ai" as const };
  }
  if (tokensMatch(provided, expectedAdmin)) {
    return { token: provided, source: "api" as const };
  }
  throw new AdminApiError(
    401,
    "UNAUTHORIZED",
    "La credencial administrativa no es válida.",
  );
}

export function tokenFingerprint(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex").slice(0, 24);
}
