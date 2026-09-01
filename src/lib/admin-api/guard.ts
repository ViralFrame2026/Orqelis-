import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticateAdminRequest } from "@/lib/admin-api/auth";
import type { AuditSource } from "@/lib/admin-api/audit";
import { AdminApiError } from "@/lib/admin-api/errors";
import { enforceRateLimit } from "@/lib/admin-api/rate-limit";
import { createAdminClient, hasAdminSupabaseConfig } from "@/lib/supabase/admin";

export type AdminApiContext = {
  client: SupabaseClient;
  source: AuditSource;
};

export async function requireAdminApi(
  request: Request,
  options: { scope?: string; limit?: number } = {},
): Promise<AdminApiContext> {
  const authentication = authenticateAdminRequest(request);
  if (!hasAdminSupabaseConfig()) {
    throw new AdminApiError(503, "SERVER_MISCONFIGURED", "La conexión administrativa no está configurada.");
  }

  const client = createAdminClient();
  await enforceRateLimit(client, authentication.token, options.scope ?? "general", options.limit ?? 120);
  const requestedSource = request.headers.get("x-orqelis-source")?.trim().toLowerCase();
  return {
    client,
    source: authentication.source === "ai" || requestedSource === "ai" ? "ai" : "api",
  };
}
