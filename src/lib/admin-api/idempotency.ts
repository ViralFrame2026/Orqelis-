import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminApiError } from "@/lib/admin-api/errors";

export type OperationResult = {
  data: unknown;
  status?: number;
  warnings?: string[];
  meta?: Record<string, unknown>;
};

type StoredIdempotency = {
  request_hash: string;
  state: "pending" | "completed";
  response_status: number | null;
  response_body: OperationResult | null;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function hashIdempotentPayload(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export function validateIdempotencyKey(value: string | null) {
  if (!value) return null;
  const key = value.trim();
  if (!/^[A-Za-z0-9._:-]{8,160}$/.test(key)) {
    throw new AdminApiError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency-Key debe tener entre 8 y 160 caracteres seguros.",
    );
  }
  return key;
}

async function getStored(client: SupabaseClient, key: string, scope: string) {
  const { data, error } = await client
    .from("admin_api_idempotency")
    .select("request_hash,state,response_status,response_body")
    .eq("idempotency_key", key)
    .eq("scope", scope)
    .maybeSingle();
  if (error) throw new AdminApiError(503, "IDEMPOTENCY_UNAVAILABLE", "No se pudo comprobar la idempotencia.");
  return data as StoredIdempotency | null;
}

export async function runIdempotent(
  client: SupabaseClient,
  keyHeader: string | null,
  scope: string,
  payload: unknown,
  operation: () => Promise<OperationResult>,
): Promise<{ result: OperationResult; replayed: boolean }> {
  const key = validateIdempotencyKey(keyHeader);
  if (!key) return { result: await operation(), replayed: false };

  const requestHash = hashIdempotentPayload(payload);
  const existing = await getStored(client, key, scope);
  if (existing) {
    if (existing.request_hash !== requestHash) {
      throw new AdminApiError(409, "IDEMPOTENCY_CONFLICT", "La clave ya fue usada con otra solicitud.");
    }
    if (existing.state === "completed" && existing.response_body) {
      return {
        result: { ...existing.response_body, status: existing.response_status ?? existing.response_body.status },
        replayed: true,
      };
    }
    throw new AdminApiError(409, "IDEMPOTENCY_IN_PROGRESS", "La solicitud con esta clave todavía está en proceso.");
  }

  const { error: claimError } = await client.from("admin_api_idempotency").insert({
    idempotency_key: key,
    scope,
    request_hash: requestHash,
    state: "pending",
  });
  if (claimError) {
    if (claimError.code === "23505") {
      const raced = await getStored(client, key, scope);
      if (raced?.request_hash === requestHash && raced.state === "completed" && raced.response_body) {
        return { result: raced.response_body, replayed: true };
      }
      throw new AdminApiError(409, "IDEMPOTENCY_IN_PROGRESS", "La solicitud con esta clave ya está en proceso.");
    }
    throw new AdminApiError(503, "IDEMPOTENCY_UNAVAILABLE", "No se pudo reservar la clave de idempotencia.");
  }

  try {
    const result = await operation();
    const { error: completeError } = await client
      .from("admin_api_idempotency")
      .update({
        state: "completed",
        response_status: result.status ?? 200,
        response_body: result,
      })
      .eq("idempotency_key", key)
      .eq("scope", scope);
    if (completeError) console.error("No se pudo completar el registro de idempotencia:", completeError.message);
    return { result, replayed: false };
  } catch (error) {
    await client.from("admin_api_idempotency").delete().eq("idempotency_key", key).eq("scope", scope);
    throw error;
  }
}

