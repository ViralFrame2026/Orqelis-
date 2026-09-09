import { NextResponse } from "next/server";
import { patchProductSchema } from "@/lib/admin-api/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/services/auth";

const MODEL = process.env.ORQELIS_AI_MODEL || "gpt-5.4";
const MAX_UPDATES = 20;

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
    const command = typeof body?.command === "string" ? body.command.trim().slice(0, 1800) : "";
    if (!command) return NextResponse.json({ error: "Escribí la operación masiva." }, { status: 400 });

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,previous_price,stock,status,featured,offer,is_new,categories(name)")
      .order("name")
      .limit(500);
    if (error) return NextResponse.json({ error: "No pude consultar el catálogo." }, { status: 503 });

    const products = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      previous_price: row.previous_price,
      stock: row.stock,
      status: row.status,
      featured: row.featured,
      offer: row.offer,
      is_new: row.is_new,
      category: Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name,
    }));
    const byId = new Map(products.map((product) => [product.id, product]));

    const apiKey = process.env.ORQELIS_CHATGPT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Falta configurar ORQELIS_CHATGPT_API_KEY." }, { status: 503 });

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        instructions: [
          "Sos ORQELIS AI. Preparás operaciones masivas sobre un catálogo real.",
          "No ejecutes cambios; solo devolvé una propuesta revisable.",
          "Usá exclusivamente IDs existentes del catálogo suministrado.",
          "Cada update debe incluir id, changes y reason.",
          "No cambies campos que el usuario no pidió.",
          "Para ocultar usá status=hidden; publicar=available; agotado=sold_out.",
          "Máximo 20 productos por propuesta. Si el pedido afectaría más, elegí los primeros 20 según el criterio pedido y explicá en summary que existe el límite de seguridad.",
          "No inventes descuentos, precios o stock. Si el pedido requiere un valor que no está definido, no propongas ese campo.",
          "Devolvé JSON válido con summary y updates.",
        ].join("\n"),
        input: `Catálogo actual:\n${JSON.stringify(products)}\n\nOperación solicitada:\n${command}`,
        text: { format: { type: "json_object" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("ORQELIS AI bulk-plan provider error:", aiResponse.status, await aiResponse.text());
      return NextResponse.json({ error: "La IA no pudo preparar la operación masiva." }, { status: 502 });
    }

    const raw = extractResponseText(await aiResponse.json());
    let generated: { summary?: string; updates?: unknown[] };
    try { generated = JSON.parse(raw) as { summary?: string; updates?: unknown[] }; }
    catch { return NextResponse.json({ error: "La IA devolvió una propuesta inválida." }, { status: 502 }); }

    const updates: Array<{ id: string; name: string; before: Record<string, unknown>; changes: Record<string, unknown>; reason: string }> = [];
    for (const candidate of Array.isArray(generated.updates) ? generated.updates.slice(0, MAX_UPDATES) : []) {
      if (!candidate || typeof candidate !== "object") continue;
      const record = candidate as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const product = byId.get(id);
      if (!product || !record.changes || typeof record.changes !== "object") continue;
      const parsed = patchProductSchema.safeParse(record.changes);
      if (!parsed.success) continue;
      const before = Object.fromEntries(Object.keys(parsed.data).map((field) => [field, (product as Record<string, unknown>)[field]]));
      updates.push({
        id,
        name: product.name,
        before,
        changes: parsed.data,
        reason: typeof record.reason === "string" ? record.reason.slice(0, 300) : "Cambio solicitado.",
      });
    }

    if (!updates.length) {
      return NextResponse.json({ error: typeof generated.summary === "string" ? generated.summary : "No encontré cambios seguros para preparar." }, { status: 422 });
    }

    return NextResponse.json({
      summary: typeof generated.summary === "string" ? generated.summary : `Preparé ${updates.length} cambios para revisar.`,
      updates,
      count: updates.length,
      max_updates: MAX_UPDATES,
      requires_confirmation: true,
    });
  } catch (error) {
    console.error("ORQELIS AI bulk-plan error:", error);
    return NextResponse.json({ error: "No pude preparar la operación masiva." }, { status: 500 });
  }
}
