import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditSource = "admin_panel" | "api" | "ai";

type ActivityInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  source: AuditSource;
  summary?: Record<string, unknown>;
};

export async function logAdminActivity(client: SupabaseClient, input: ActivityInput) {
  const { error } = await client.from("admin_activity_log").insert({
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    source: input.source,
    summary: input.summary ?? {},
  });
  if (error) console.error("No se pudo registrar la actividad administrativa:", error.message);
}

