"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Bot, Camera, CheckCircle2, ImagePlus, LoaderCircle, Sparkles, Trash2, WandSparkles } from "lucide-react";

type DemoProduct = { name: string; price: number; stock: number | null; status: string };
type Props = { products: DemoProduct[] };
type AiResult = {
  answer: string;
  intent: "read" | "write-preview" | "other";
  affected_products: string[];
  proposed_steps: string[];
  detected_product?: { name?: string; category?: string; description?: string } | null;
  image_received?: boolean;
  image_action?: string | null;
  mode?: "ai" | "fallback";
};

async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elegí una imagen válida.");
  if (file.size > 12 * 1024 * 1024) throw new Error("La foto supera los 12 MB.");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No pude leer la imagen."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("No pude abrir la imagen."));
    element.src = dataUrl;
  });

  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pude preparar la imagen.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function OrqelisAiDemo({ products }: Props) {
  const [command, setCommand] = useState("Mostrame qué productos están publicados");
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    try {
      const prepared = await compressImage(file);
      setImageDataUrl(prepared);
      setImageName(file.name);
      if (!command.trim() || command === "Mostrame qué productos están publicados") {
        setCommand("Analizá esta foto y prepará el producto para publicarlo usando esta misma imagen");
      }
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "No pude preparar la foto.");
      event.target.value = "";
    }
  }

  function removeImage() {
    setImageDataUrl("");
    setImageName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    const value = command.trim();
    if ((!value && !imageDataUrl) || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/demo-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: value, image_data_url: imageDataUrl || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No pude procesar el pedido.");
      setResult(payload as AiResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pude procesar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="ia-demo" className="bg-ink py-16 text-white sm:py-24">
      <div className="container-store">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-sand"><Sparkles size={14}/> Probá ORQELIS AI</div>
          <h2 className="font-display mt-4 text-4xl sm:text-5xl">Texto + foto, como se lo pedirías a una persona</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/60">Adjuntá una foto de un producto y pedile a ORQELIS que lo prepare. La misma imagen queda asociada a la propuesta para publicarla desde el panel privado al confirmar.</p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] bg-white text-ink shadow-2xl">
          <div className="flex items-center gap-3 border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-2xl bg-forest text-white"><Bot size={21}/></span><div><p className="font-extrabold">ORQELIS AI Demo</p><p className="text-xs text-ink/45">{products.length} productos visibles · entiende texto e imágenes · escrituras simuladas</p></div></div>
          <div className="p-5 sm:p-7">
            <div className="grid gap-2 sm:grid-cols-2">{["Mostrame qué productos están publicados", "Ocultá los productos sin stock", "Agregá un termo a $55.000, stock 5 y destacalo", "Analizá esta foto y prepará el producto para publicarlo"].map((example) => <button key={example} type="button" onClick={() => { setCommand(example); setResult(null); setError(""); }} className="rounded-xl border border-ink/8 p-3 text-left text-xs font-bold leading-5 text-ink/55 transition hover:border-clay/30 hover:bg-sand/20">“{example}”</button>)}</div>

            <form onSubmit={run} className="mt-5 rounded-2xl border-2 border-dashed border-ink/10 p-4 sm:p-5">
              <textarea value={command} onChange={(event) => { setCommand(event.target.value); setResult(null); setError(""); }} rows={4} className="w-full resize-none bg-transparent text-sm outline-none" aria-label="Pedido para ORQELIS AI" placeholder="Ej: Publicá este producto a $55.000, stock 5, hacé una descripción y usá esta misma foto."/>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} className="hidden" />
              {imageDataUrl ? <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-[#f8f6f2]"><div className="grid gap-4 p-4 sm:grid-cols-[150px_1fr_auto] sm:items-center"><img src={imageDataUrl} alt="Foto adjunta para ORQELIS AI" className="h-36 w-full rounded-xl object-cover sm:w-36"/><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-forest"><CheckCircle2 size={15}/> Foto lista</div><p className="mt-2 truncate text-sm font-extrabold">{imageName || "Producto adjunto"}</p><p className="mt-1 text-xs leading-5 text-ink/45">ORQELIS analizará esta foto y conservará esta misma imagen para la publicación.</p></div><button type="button" onClick={removeImage} className="grid size-10 place-items-center rounded-xl border border-ink/10 bg-white text-ink/45" aria-label="Quitar foto"><Trash2 size={17}/></button></div></div> : <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 flex min-h-24 w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-clay/35 bg-sand/15 px-5 text-sm font-extrabold text-clay transition hover:bg-sand/30"><ImagePlus size={20}/> Adjuntar foto del producto</button>}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-ink/40"><Camera size={15}/> JPG, PNG o WebP. La demo comprime la imagen antes de analizarla.</p><button disabled={loading || (!command.trim() && !imageDataUrl)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoaderCircle size={16} className="animate-spin"/> : <WandSparkles size={16}/>} {loading ? "Analizando..." : "Probar IA"}</button></div>
            </form>

            {error ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

            {result ? <div className="mt-5 rounded-2xl bg-sage/45 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-forest"><CheckCircle2 size={15}/> Respuesta de ORQELIS</div><span className="rounded-full bg-white/70 px-2.5 py-1 text-[.65rem] font-black uppercase text-forest">{result.mode === "ai" ? "IA generativa" : "Modo seguro"}</span></div><p className="mt-3 rounded-xl bg-white/80 p-4 text-sm leading-6 text-ink/70">{result.answer}</p>{result.image_received && imageDataUrl ? <div className="mt-3 grid gap-3 rounded-xl bg-white/75 p-3 sm:grid-cols-[88px_1fr] sm:items-center"><img src={imageDataUrl} alt="Imagen que se usaría para publicar" className="h-20 w-full rounded-lg object-cover sm:w-20"/><div><p className="text-xs font-black uppercase tracking-[.1em] text-forest">Imagen de publicación</p><p className="mt-1 text-xs leading-5 text-ink/55">{result.image_action || "Se conservará la misma foto adjunta."}</p></div></div> : null}{result.detected_product ? <div className="mt-3 rounded-xl bg-white/75 p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-ink/40">Producto detectado</p>{result.detected_product.name ? <p className="mt-2 text-base font-extrabold">{result.detected_product.name}</p> : null}{result.detected_product.category ? <p className="mt-1 text-xs font-bold text-clay">{result.detected_product.category}</p> : null}{result.detected_product.description ? <p className="mt-2 text-sm leading-6 text-ink/60">{result.detected_product.description}</p> : null}</div> : null}{result.affected_products?.length ? <div className="mt-3"><p className="text-xs font-black uppercase tracking-[.1em] text-ink/40">Productos detectados</p><div className="mt-2 flex flex-wrap gap-2">{result.affected_products.map((product) => <span key={product} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink/60">{product}</span>)}</div></div> : null}{result.proposed_steps?.length ? <div className="mt-4 grid gap-2">{result.proposed_steps.map((step, index) => <div key={`${step}-${index}`} className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs font-semibold text-ink/60"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest text-[.62rem] font-black text-white">{index + 1}</span>{step}</div>)}</div> : null}{result.intent === "write-preview" ? <p className="mt-4 text-xs font-extrabold text-forest">Demo pública: la publicación se previsualiza, pero no modifica datos reales.</p> : null}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
