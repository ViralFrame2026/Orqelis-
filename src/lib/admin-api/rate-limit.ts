import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminApiError } from "@/lib/admin-api/errors";
import { tokenFingerprint } from "@/lib/admin-api/auth";

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

export async function enforceRateLimit(
  client: SupabaseClient,
  token: string,
  scope: string,
  limit = 120,
  windowSeconds = 60,
) {
  const bucket = `${tokenFingerprint(token)}:${scope}`;
  const { data, error } = await client.rpc("consume_admin_api_rate_limit", {
    p_bucket_key: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Admin API rate limit error:", error.message);
    throw new AdminApiError(503, "RATE_LIMIT_UNAVAILABLE", "No se pudo validar el límite de uso.");
  }

  const result = (data as RateLimitRow[] | null)?.[0];
  if (!result?.allowed) {
    throw new AdminApiError(429, "RATE_LIMITED", "Se alcanzó temporalmente el límite de solicitudes.", [
      { retry_after: result?.reset_at ?? null },
    ]);
  }
  return result;
}

