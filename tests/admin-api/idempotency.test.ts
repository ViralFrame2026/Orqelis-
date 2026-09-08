import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { hashIdempotentPayload, runIdempotent, validateIdempotencyKey } from "@/lib/admin-api/idempotency";

function inMemoryClient() {
  let row: Record<string, unknown> | null = null;
  const from = vi.fn(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
    }),
    insert: async (value: Record<string, unknown>) => {
      if (row) return { error: { code: "23505" } };
      row = { ...value };
      return { error: null };
    },
    update: (value: Record<string, unknown>) => ({
      eq: () => ({
        eq: async () => {
          row = { ...(row ?? {}), ...value };
          return { error: null };
        },
      }),
    }),
    delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
  }));
  return { client: { from } as unknown as SupabaseClient };
}

describe("idempotencia", () => {
  it("genera el mismo hash aunque cambie el orden de las propiedades", () => {
    expect(hashIdempotentPayload({ a: 1, b: 2 })).toBe(hashIdempotentPayload({ b: 2, a: 1 }));
  });

  it("reproduce el resultado sin ejecutar dos veces la creación", async () => {
    const { client } = inMemoryClient();
    const operation = vi.fn(async () => ({ data: { id: "producto-1" }, status: 201 }));
    const first = await runIdempotent(client, "producto-2026-0001", "create", { name: "Producto" }, operation);
    const second = await runIdempotent(client, "producto-2026-0001", "create", { name: "Producto" }, operation);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.result.data).toEqual({ id: "producto-1" });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("rechaza claves demasiado cortas", () => {
    expect(() => validateIdempotencyKey("corta")).toThrow();
  });
});

