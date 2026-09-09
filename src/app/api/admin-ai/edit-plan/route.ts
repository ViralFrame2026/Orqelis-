import { NextResponse } from "next/server";
import { patchProductSchema } from "@/lib/admin-api/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/services/auth";

const MODEL = process.env.ORQELIS_AI_MODEL || "gpt-5.4";

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await request.json();
    const command = typeof body?.command === "string" ? body.command.trim().slice(0, 1500) : "";
    if (!command) return NextResponse.json({ error: "Escribí qué querés modificar." }, { status: 400 });

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

    const { data: products, error } = await supabase
      .from("products")
      .select("id,name,price,previous_price,stock,status,featured,offer,short_description,description,categories(name)")
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) return NextResponse.json({ error: "No pude consultar el catálogo." }, { status: 503 });

    const apiKey = process.env.ORQELIS_CHATGPT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Falta configurar ORQELIS_CHATGPT_API_KEY." }, { status: 503 });

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        instructions: [
          "Sos ORQELIS AI, asistente de catálogo para un administrador de tienda.",
          "Debés identificar exactamente un producto existente del catálogo y proponer cambios basados únicamente en la orden.",
          "No ejecutes nada. Solo devolvé una propuesta para revisión.",
          "No cambies campos no pedidos. No inventes precios, stock, descuentos ni datos técnicos.",
          "Para ocultar usá status=hidden; para publicar usá status=available; agotado=sold_out; archivar=archived.",
          "Si pide oferta y proporciona precio anterior, usá offer=true y previous_price. Si no proporciona un valor, no lo inventes.",
          "Campos permitidos en changes: name, sku, category, short_description, description, price, previous_price, installments, installment_price, stock, status, featured, offer, is_new, tags, features.",
          "No incluyas images ni slug salvo pedido explícito de nombre/slug.",
          "Devolvé solo JSON válido con target_id, target_name, summary y changes.",
        ].join("\n"),
        input: `Catálogo actual: ${JSON.stringify(products || [])}\n\nOrden del administrador: ${command}`,
        text: { format: { type: "json_object" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("ORQELIS AI edit-plan provider error:", aiResponse.status, await aiResponse.text());
      return NextResponse.json({ error: "La IA no pudo preparar la modificación." }, { status: 502 });
    }

    const raw = extractResponseText(await aiResponse.json());
    let generated: Record<string, unknown>;
    try { generated = JSON.parse(raw) as Record<string, unknown>; }
    catch { return NextResponse.json({ error: "La IA devolvió una propuesta inválida." }, { status: 502 }); }

    const targetId = typeof generated.target_id === "string" ? generated.target_id : "";
    const target = (products || []).find((product) => product.id === targetId);
    if (!target) return NextResponse.json({ error: "No pude identificar con seguridad un producto existente." }, { status: 422 });

    const rawChanges = generated.changes && typeof generated.changes === "object"
      ? { ...(generated.changes as Record<string, unknown>) }
      : {};
    delete rawChanges.images;

    const parsed = patchProductSchema.safeParse(rawChanges);
    if (!parsed.success) {
      return NextResponse.json({
        error: "La propuesta necesita correcciones.",
        details: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
      }, { status: 422 });
    }

    return NextResponse.json({
      target: target,
      changes: parsed.data,
      summary: typeof generated.summary === "string" ? generated.summary : `Modificar ${target.name}`,
      changed_fields: Object.keys(parsed.data),
    });
  } catch (error) {
    console.error("ORQELIS AI edit-plan error:", error);
    return NextResponse.json({ error: "No pude preparar la modificación." }, { status: 500 });
  }
}
