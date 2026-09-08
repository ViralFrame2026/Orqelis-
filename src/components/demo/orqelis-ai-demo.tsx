"use client";

import { FormEvent, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";

type DemoProduct = { name: string; price: number; stock: number | null; status: string };
type Props = { products: DemoProduct[] };
type AiResult = {
  answer: string;
  intent: "read" | "write-preview" | "other";
  affected_products: string[];
  proposed_steps: string[];
  mode?: "ai" | "fallback";
};

export function OrqelisAiDemo({ products }: Props) {
  const [command, setCommand] = useState("Mostrame qué productos están publicados");
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(event: FormEvent) {
    event.preventDefault();
    const value = command.trim();
    if (!value || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/demo-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: value }),
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
          <h2 className="font-display mt-4 text-4xl sm:text-5xl">Pedile algo como si hablaras con una persona</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/60">La demo consulta el catálogo visible actual. Las acciones que modificarían datos se convierten en una propuesta segura, sin tocar la tienda real.</p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] bg-white text-ink shadow-2xl">
          <div className="flex items-center gap-3 border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-2xl bg-forest text-white"><Bot size={21}/></span><div><p className="font-extrabold">ORQELIS AI Demo</p><p className="text-xs text-ink/45">{products.length} productos visibles · lectura real · escrituras simuladas</p></div></div>
          <div className="p-5 sm:p-7">
            <div className="grid gap-2 sm:grid-cols-2">{["Mostrame qué productos están publicados", "Ocultá los productos sin stock", "Agregá un termo a $55.000, stock 5 y destacalo", "Prepará una oferta sin cambiar el precio actual"].map((example) => <button key={example} type="button" onClick={() => { setCommand(example); setResult(null); setError(""); }} className="rounded-xl border border-ink/8 p-3 text-left text-xs font-bold leading-5 text-ink/55 transition hover:border-clay/30 hover:bg-sand/20">“{example}”</button>)}</div>

            <form onSubmit={run} className="mt-5 rounded-2xl border-2 border-dashed border-ink/10 p-4 sm:p-5"><textarea value={command} onChange={(event) => { setCommand(event.target.value); setResult(null); setError(""); }} rows={4} className="w-full resize-none bg-transparent text-sm outline-none" aria-label="Pedido para ORQELIS AI"/><div className="mt-3 flex justify-end"><button disabled={loading || !command.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoaderCircle size={16} className="animate-spin"/> : <WandSparkles size={16}/>} {loading ? "Pensando..." : "Probar IA"}</button></div></form>

            {error ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

            {result ? <div className="mt-5 rounded-2xl bg-sage/45 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-forest"><CheckCircle2 size={15}/> Respuesta de ORQELIS</div><span className="rounded-full bg-white/70 px-2.5 py-1 text-[.65rem] font-black uppercase text-forest">{result.mode === "ai" ? "IA generativa" : "Modo seguro"}</span></div><p className="mt-3 rounded-xl bg-white/80 p-4 text-sm leading-6 text-ink/70">{result.answer}</p>{result.affected_products?.length ? <div className="mt-3"><p className="text-xs font-black uppercase tracking-[.1em] text-ink/40">Productos detectados</p><div className="mt-2 flex flex-wrap gap-2">{result.affected_products.map((product) => <span key={product} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink/60">{product}</span>)}</div></div> : null}{result.proposed_steps?.length ? <div className="mt-4 grid gap-2">{result.proposed_steps.map((step, index) => <div key={`${step}-${index}`} className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs font-semibold text-ink/60"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest text-[.62rem] font-black text-white">{index + 1}</span>{step}</div>)}</div> : null}{result.intent === "write-preview" ? <p className="mt-4 text-xs font-extrabold text-forest">Demo pública: esta acción no modifica datos reales.</p> : null}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
