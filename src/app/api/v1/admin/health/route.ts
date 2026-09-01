import { createAdminClient, hasAdminSupabaseConfig } from "@/lib/supabase/admin";
import { successResponse } from "@/lib/admin-api/responses";

export async function GET() {
  const apiKeyConfigured = (process.env.ORQELIS_ADMIN_API_KEY?.trim().length ?? 0) >= 32;
  const chatGptKeyConfigured = (process.env.ORQELIS_CHATGPT_API_KEY?.trim().length ?? 0) >= 32;
  const databaseConfigured = hasAdminSupabaseConfig();
  let databaseReachable = false;
  let migrationReady = false;

  if (databaseConfigured) {
    try {
      const client = createAdminClient();
      const [{ error: databaseError }, { error: migrationError }] = await Promise.all([
        client.from("categories").select("id").limit(1),
        client.from("admin_activity_log").select("id").limit(1),
      ]);
      databaseReachable = !databaseError;
      migrationReady = !migrationError;
    } catch {
      databaseReachable = false;
    }
  }

  const ready = apiKeyConfigured && chatGptKeyConfigured && databaseConfigured && databaseReachable && migrationReady;
  return successResponse(
    {
      service: "orqelis-admin-api",
      version: "v1",
      status: ready ? "ready" : "degraded",
      checks: {
        api_key_configured: apiKeyConfigured,
        chatgpt_key_configured: chatGptKeyConfigured,
        database_configured: databaseConfigured,
        database_reachable: databaseReachable,
        migration_ready: migrationReady,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
