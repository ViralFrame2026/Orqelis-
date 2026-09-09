import { NextResponse } from "next/server";
import { patchProductSchema } from "@/lib/admin-api/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/services/auth";
import { updateAdminProduct } from "@/services/admin-products";

const MAX_UPDATES = 20;

export async function POST(request: Request) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await request.json();
    const confirmation = body?.confirmation === "CONFIRM_BULK";
    const rawUpdates = Array.isArray(body?.updates) ? body.updates : [];
    if (!confirmation) return NextResponse.json({ error: "Falta confirmación explícita para la operación masiva." }, { status: 400 });
    if (!rawUpdates.length || rawUpdates.length > MAX_UPDATES) {
      return NextResponse.json({ error: `La operación debe contener entre 1 y ${MAX_UPDATES} productos.` }, { status: 422 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

    const results: Array<{ id: string; success: boolean; name?: string; error?: string }> = [];
    for (const candidate of rawUpdates) {
      if (!candidate || typeof candidate !== "object") continue;
      const record = candidate as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const parsed = patchProductSchema.safeParse(record.changes);
      if (!id || !parsed.success) {
        results.push({ id, success: false, error: "Cambio inválido." });
        continue;
      }
      try {
        const result = await updateAdminProduct(supabase, id, parsed.data, "ai");
        results.push({ id, success: true, name: result.product.name });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : "No se pudo modificar." });
      }
    }

    const modified = results.filter((item) => item.success).length;
    const failed = results.length - modified;
    return NextResponse.json({
      message: failed ? `${modified} producto(s) modificados y ${failed} con error.` : `${modified} producto(s) modificados correctamente.`,
      modified,
      failed,
      results,
    }, { status: failed ? 207 : 200 });
  } catch (error) {
    console.error("ORQELIS AI bulk-apply error:", error);
    return NextResponse.json({ error: "No pude aplicar la operación masiva." }, { status: 500 });
  }
}
