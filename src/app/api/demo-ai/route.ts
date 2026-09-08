import { NextResponse } from "next/server";
import { getProducts } from "@/services/catalog";

const MODEL = process.env.ORQELIS_AI_MODEL || "gpt-5.4";
const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000;

type AiPayload = {
  answer?: string;
  intent?: "read" | "write-preview" | "other";
  affected_products?: string[];
  proposed_steps?: string[];
  detected_product?: {
    name?: string;
    category?: string;
    description?: string;
  } | null;
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

function safeFallback(
  command: string,
  products: Awaited<ReturnType<typeof getProducts>>,
  hasImage: boolean,
) {
  const text = command.toLocaleLowerCase("es");
  if (/mostr|ver|list|publicad|visible|producto/.test(text) && !/agreg|cre|sub|nuevo|public/.test(text)) {
    const list = products.slice(0, 4).map((product) => `${product.name} ($${product.price.toLocaleString("es-AR")})`).join(", ");
    return {
      answer: `Hay ${products.length} productos visibles en la demo${list ? `: ${list}` : "."}`,
      intent: "read" as const,
      affected_products: products.slice(0, 4).map((product) => product.name),
      proposed_steps: ["Consultar el catálogo visible", "Responder sin modificar datos"],
      detected_product: null,
      image_received: hasImage,
      image_action: hasImage ? "La foto adjunta se conservaría como imagen del producto al publicar." : null,
      mode: "fallback",
    };
  }
  return {
    answer: hasImage
      ? "Recibí la foto. Prepararía la ficha del producto y conservaría exactamente esa imagen para publicarla al confirmar desde el panel privado."
      : "Entendí el pedido. En la demo pública las acciones que modificarían el catálogo se muestran únicamente como propuesta segura.",
    intent: "write-preview" as const,
    affected_products: [],
    proposed_steps: hasImage
      ? ["Analizar la foto y el pedido", "Preparar nombre, descripción, categoría, precio y stock", "Mostrar la vista previa con la misma foto", "Al confirmar en el admin, subir esa foto y crear el producto"]
      : ["Interpretar el pedido", "Identificar productos afectados", "Mostrar una vista previa", "Solicitar confirmación en el panel privado"],
    detected_product: null,
    image_received: hasImage,
    image_action: hasImage ? "La misma foto adjunta se usaría como imagen principal del producto." : null,
    mode: "fallback",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const command = typeof body?.command === "string" ? body.command.trim().slice(0, 1200) : "";
    const imageDataUrl = typeof body?.image_data_url === "string" ? body.image_data_url : "";
    const validImage = /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageDataUrl) && imageDataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH;

    if (!command && !validImage) {
      return NextResponse.json({ error: "Escribí un pedido o adjuntá una foto para ORQELIS AI." }, { status: 400 });
    }
    if (imageDataUrl && !validImage) {
      return NextResponse.json({ error: "La imagen no es válida o supera el tamaño permitido para la demo." }, { status: 413 });
    }

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
    if (!apiKey) return NextResponse.json(safeFallback(command, products, validImage));

    const userText = [
      "Devolvé JSON válido con las claves answer, intent, affected_products, proposed_steps y detected_product.",
      "intent debe ser read, write-preview u other.",
      "detected_product debe ser null si no hay foto o un objeto con name, category y description si podés identificar el producto de la imagen.",
      `Catálogo visible actual:\n${JSON.stringify(catalog)}`,
      `Pedido del usuario:\n${command || "Analizá la foto y prepará una ficha para publicarla."}`,
    ].join("\n\n");

    const content: Array<Record<string, string>> = [{ type: "input_text", text: userText }];
    if (validImage) content.push({ type: "input_image", image_url: imageDataUrl });

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
          "Si hay una foto adjunta, analizala para identificar el producto y preparar una ficha comercial útil.",
          "Si el usuario quiere crear/publicar un producto con una foto, la propuesta debe conservar ESA MISMA foto como imagen principal; no propongas reemplazarla ni generar otra.",
          "Si faltan precio, stock o categoría, señalalos como datos pendientes en lugar de inventarlos.",
          "Si el usuario pide crear, editar, ocultar, publicar, borrar, cambiar precio, stock, oferta o destacado, tratá el pedido como write-preview: describí qué harías, pero aclarando que es una simulación pública.",
          "No inventes productos que no estén en el catálogo salvo que el usuario esté proponiendo crear uno nuevo.",
        ].join("\n"),
        input: [{ role: "user", content }],
        text: { format: { type: "json_object" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("ORQELIS AI provider error:", aiResponse.status, await aiResponse.text());
      return NextResponse.json(safeFallback(command, products, validImage));
    }

    const providerPayload = await aiResponse.json();
    const raw = extractResponseText(providerPayload);
    let parsed: AiPayload | null = null;
    try { parsed = raw ? JSON.parse(raw) as AiPayload : null; } catch { parsed = null; }

    if (!parsed?.answer) return NextResponse.json(safeFallback(command, products, validImage));

    return NextResponse.json({
      answer: parsed.answer,
      intent: parsed.intent || (validImage ? "write-preview" : "other"),
      affected_products: Array.isArray(parsed.affected_products) ? parsed.affected_products.slice(0, 12) : [],
      proposed_steps: Array.isArray(parsed.proposed_steps) ? parsed.proposed_steps.slice(0, 8) : [],
      detected_product: parsed.detected_product && typeof parsed.detected_product === "object" ? {
        name: typeof parsed.detected_product.name === "string" ? parsed.detected_product.name.slice(0, 220) : "",
        category: typeof parsed.detected_product.category === "string" ? parsed.detected_product.category.slice(0, 120) : "",
        description: typeof parsed.detected_product.description === "string" ? parsed.detected_product.description.slice(0, 600) : "",
      } : null,
      image_received: validImage,
      image_action: validImage ? "La misma foto adjunta se usaría como imagen principal al publicar desde el panel privado." : null,
      mode: "ai",
    });
  } catch (error) {
    console.error("ORQELIS AI demo error:", error);
    return NextResponse.json({ error: "No pude procesar el pedido en este momento." }, { status: 500 });
  }
}
