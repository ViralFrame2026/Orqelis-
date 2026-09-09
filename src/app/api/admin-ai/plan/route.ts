import { NextResponse } from "next/server";
import { createProductSchema } from "@/lib/admin-api/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/services/auth";
import { previewAdminProduct } from "@/services/admin-products";

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

    const formData = await request.formData();
    const command = String(formData.get("command") || "").trim().slice(0, 1500);
    const image = formData.get("image");
    if (!command) return NextResponse.json({ error: "Escribí qué querés publicar." }, { status: 400 });

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

    const { data: categories, error: categoriesError } = await supabase.from("categories").select("name,slug").order("name");
    if (categoriesError) return NextResponse.json({ error: "No pude consultar las categorías." }, { status: 503 });

    const apiKey = process.env.ORQELIS_CHATGPT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Falta configurar ORQELIS_CHATGPT_API_KEY para generar fichas con IA." }, { status: 503 });

    const inputContent: Record<string, unknown>[] = [{ type: "input_text", text: command }];
    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) return NextResponse.json({ error: "El archivo adjunto debe ser una imagen." }, { status: 415 });
      if (image.size > 8 * 1024 * 1024) return NextResponse.json({ error: "La imagen supera 8 MB." }, { status: 413 });
      const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
      inputContent.push({ type: "input_image", image_url: `data:${image.type};base64,${base64}` });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        instructions: [
          "Sos ORQELIS AI, asistente de catálogo de una tienda argentina.",
          "Tu tarea es convertir el pedido del administrador y, si existe, la foto del producto en una ficha lista para revisión.",
          "Nunca inventes especificaciones técnicas que no puedas inferir razonablemente de la imagen o del pedido.",
          "Elegí category exclusivamente entre las categorías disponibles suministradas.",
          "Si el usuario no especifica stock, usá null. Si no especifica precio y no se puede inferir, usá 0 para que sea evidente que debe corregirse antes de publicar.",
          "Si pide publicar, status debe ser available. Si no lo aclara, usá hidden por seguridad.",
          "Si pide destacar, featured=true. Si pide oferta, offer=true y previous_price solo si fue indicado explícitamente.",
          "Generá short_description comercial breve, description útil y 3 a 6 features basadas solo en lo observable o indicado.",
          "La imagen adjunta NO se reemplaza ni se genera: se conservará como imagen principal al confirmar.",
          "Devolvé únicamente JSON válido.",
        ].join("\n"),
        input: [{ role: "user", content: [
          { type: "input_text", text: `Categorías disponibles: ${JSON.stringify(categories || [])}` },
          ...inputContent,
        ] }],
        text: { format: { type: "json_object" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("ORQELIS AI plan provider error:", aiResponse.status, await aiResponse.text());
      return NextResponse.json({ error: "La IA no pudo preparar la ficha." }, { status: 502 });
    }

    const raw = extractResponseText(await aiResponse.json());
    let generated: Record<string, unknown>;
    try { generated = JSON.parse(raw) as Record<string, unknown>; }
    catch { return NextResponse.json({ error: "La IA devolvió una ficha inválida." }, { status: 502 }); }

    const candidate = {
      name: generated.name ?? "",
      category: generated.category ?? categories?.[0]?.name ?? "",
      short_description: generated.short_description ?? "",
      description: generated.description ?? "",
      price: generated.price ?? 0,
      previous_price: generated.previous_price ?? null,
      installments: generated.installments ?? null,
      installment_price: generated.installment_price ?? null,
      stock: generated.stock ?? null,
      status: generated.status ?? "hidden",
      featured: generated.featured ?? false,
      offer: generated.offer ?? false,
      is_new: generated.is_new ?? true,
      tags: Array.isArray(generated.tags) ? generated.tags : [],
      features: Array.isArray(generated.features) ? generated.features : [],
      images: [],
      sku: generated.sku ?? null,
    };

    const parsed = createProductSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json({
        error: "La ficha necesita correcciones antes de publicarse.",
        details: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
        draft: candidate,
      }, { status: 422 });
    }

    const preview = await previewAdminProduct(supabase, parsed.data);
    return NextResponse.json({
      draft: parsed.data,
      preview: preview.product,
      warnings: preview.warnings,
      can_create: preview.can_create,
      has_image: image instanceof File && image.size > 0,
    });
  } catch (error) {
    console.error("ORQELIS AI admin plan error:", error);
    return NextResponse.json({ error: "No pude preparar la publicación." }, { status: 500 });
  }
}
