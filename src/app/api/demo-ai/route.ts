import { NextResponse } from "next/server";
import { getProducts } from "@/services/catalog";

const MODEL = process.env.ORQELIS_AI_MODEL || "gpt-5.4";

type AiPayload = {
  answer?: string;
  intent?: "read" | "write-preview" | "other";
  affected_products?: string[];
  proposed_steps?: string[];
};

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

function safeFallback(command: string, products: Awaited<ReturnType<typeof getProducts>>) {
  const text = command.toLocaleLowerCase("es");
  if (/mostr|ver|list|publicad|visible|producto/.test(text) && !/agreg|cre|sub|nuevo/.test(text)) {
    const list = products.slice(0, 4).map((product) => `${product.name} ($${product.price.toLocaleString("es-AR")})`).join(", ");
    return {
      answer: `Hay ${products.length} productos visibles en la demo${list ? `: ${list}` : "."}`,
      intent: "read" as const,
      affected_products: products.slice(0, 4).map((product) => product.name),
      proposed_steps: ["Consultar el catálogo visible", "Responder sin modificar datos"],
      mode: "fallback",
    };
  }
  return {
    answer: "Entendí el pedido. En la demo pública las acciones que modificarían el catálogo se muestran únicamente como propuesta segura.",
    intent: "write-preview" as const,
    affected_products: [],
    proposed_steps: ["Interpretar el pedido", "Identificar productos afectados", "Mostrar una vista previa", "Solicitar confirmación en el panel privado"],
    mode: "fallback",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const command = typeof body?.command === "string" ? body.command.trim().slice(0, 1200) : "";
    if (!command) return NextResponse.json({ error: "Escribí un pedido para ORQELIS AI." }, { status: 400 });

    const products = await getProducts();
    const catalog = products.slice(0, 20).map((product) => ({
      name: product.name,
      price: product.price,
      previous_price: product.previous_price,
      stock: product.stock,
      status: product.status,
      featured: product.featured,
      offer: product.offer,
      category: product.category.name,
    }));

    const apiKey = process.env.ORQELIS_CHATGPT_API_KEY;
    if (!apiKey) return NextResponse.json(safeFallback(command, products));

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: [
          "Sos ORQELIS AI, asistente de administración de una tienda online argentina.",
          "Respondé siempre en español rioplatense, claro y breve.",
          "La demo pública es estrictamente segura: jamás afirmes que ejecutaste cambios reales.",
          "Podés consultar el catálogo suministrado y responder con datos reales visibles.",
          "Si el usuario pide crear, editar, ocultar, publicar, borrar, cambiar precio, stock, oferta o destacado, tratá el pedido como write-preview: describí qué harías y qué productos afectarías, pero aclarando que es una simulación.",
          "No inventes productos que no estén en el catálogo salvo que el usuario esté proponiendo crear uno nuevo.",
        ].join("\n"),
        input: `Devolvé JSON válido con las claves answer, intent, affected_products y proposed_steps. intent debe ser read, write-preview u other.\n\nCatálogo visible actual:\n${JSON.stringify(catalog)}\n\nPedido del usuario:\n${command}`,
        text: { format: { type: "json_object" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("ORQELIS AI provider error:", aiResponse.status, await aiResponse.text());
      return NextResponse.json(safeFallback(command, products));
    }

    const providerPayload = await aiResponse.json();
    const raw = extractResponseText(providerPayload);
    let parsed: AiPayload | null = null;
    try { parsed = raw ? JSON.parse(raw) as AiPayload : null; } catch { parsed = null; }

    if (!parsed?.answer) return NextResponse.json(safeFallback(command, products));

    return NextResponse.json({
      answer: parsed.answer,
      intent: parsed.intent || "other",
      affected_products: Array.isArray(parsed.affected_products) ? parsed.affected_products.slice(0, 12) : [],
      proposed_steps: Array.isArray(parsed.proposed_steps) ? parsed.proposed_steps.slice(0, 8) : [],
      mode: "ai",
    });
  } catch (error) {
    console.error("ORQELIS AI demo error:", error);
    return NextResponse.json({ error: "No pude procesar el pedido en este momento." }, { status: 500 });
  }
}
