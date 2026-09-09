"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Layers3, LoaderCircle, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

type BulkUpdate = {
  id: string;
  name: string;
  before: Record<string, unknown>;
  changes: Record<string, unknown>;
  reason: string;
};

type BulkPlan = {
  summary: string;
  updates: BulkUpdate[];
  count: number;
  max_updates: number;
  requires_confirmation: boolean;
};

const labels: Record<string, string> = {
  price: "Precio",
  previous_price: "Precio anterior",
  stock: "Stock",
  status: "Estado",
  featured: "Destacado",
  offer: "Oferta",
  is_new: "Nuevo",
};

function valueLabel(value: unknown) {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("es-AR");
  return String(value);
}

export default function BulkAssistantPage() {
  const [command, setCommand] = useState("Ocultá todos los productos sin stock que estén publicados.");
  const [plan, setPlan] = useState<BulkPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function prepare(event: FormEvent) {
    event.preventDefault();
    if (!command.trim() || loading) return;
    setLoading(true); setError(""); setSuccess(""); setPlan(null);
    try {
      const response = await fetch("/api/admin-ai/bulk-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No pude preparar la operación masiva.");
      setPlan(payload as BulkPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude preparar la operación masiva.");
    } finally { setLoading(false); }
  }

  async function apply() {
    if (!plan || applying) return;
    setApplying(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin-ai/bulk-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: "CONFIRM_BULK",
          updates: plan.updates.map((update) => ({ id: update.id, changes: update.changes })),
        }),
      });
      const payload = await response.json();
      if (!response.ok && response.status !== 207) throw new Error(payload?.error || "No pude aplicar la operación.");
      setSuccess(payload.message || "Operación completada.");
      setPlan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude aplicar la operación.");
    } finally { setApplying(false); }
  }

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-forest"><Sparkles size={14}/> ORQELIS AI · Masivo</div><h1 className="font-display mt-4 text-4xl sm:text-5xl">Cambiá varios productos con una sola orden.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">ORQELIS identifica los productos afectados, te muestra cada cambio y recién lo aplica cuando confirmás. Máximo 20 productos por operación.</p></div>
      <Link href="/admin/asistente" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold"><ArrowLeft size={16}/> Volver al asistente</Link>
    </div>

    <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
      <section className="rounded-[1.6rem] border border-ink/8 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-2 sm:grid-cols-2">{[
          "Ocultá todos los productos sin stock que estén publicados.",
          "Sacale el destacado a todos los productos ocultos.",
          "Marcá como agotados los productos visibles con stock 0.",
          "Quitá la oferta de todos los productos que estén ocultos.",
        ].map((example) => <button key={example} type="button" onClick={() => { setCommand(example); setPlan(null); setError(""); setSuccess(""); }} className="rounded-xl border border-ink/8 p-3 text-left text-xs font-semibold leading-5 text-ink/55 hover:border-clay/35 hover:bg-sand/20">“{example}”</button>)}</div>

        <form onSubmit={prepare} className="mt-5 rounded-2xl border-2 border-dashed border-ink/10 p-5"><label className="text-xs font-black uppercase tracking-[.12em] text-ink/45">Operación masiva</label><textarea value={command} onChange={(e) => { setCommand(e.target.value); setPlan(null); }} rows={5} className="mt-3 w-full resize-none bg-transparent text-sm outline-none"/><div className="mt-3 flex justify-end"><button disabled={loading || !command.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:opacity-40">{loading ? <LoaderCircle className="animate-spin" size={16}/> : <WandSparkles size={16}/>} {loading ? "Analizando catálogo..." : "Preparar operación"}</button></div></form>

        {error ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
        {success ? <div className="mt-5 rounded-2xl bg-sage p-4 text-sm font-extrabold text-forest">{success}</div> : null}

        {plan ? <div className="mt-6 rounded-2xl border border-forest/15 bg-sage/25 p-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-forest"><CheckCircle2 size={15}/> Vista previa · {plan.count} producto{plan.count === 1 ? "" : "s"}</div><p className="mt-3 text-sm leading-6 text-ink/60">{plan.summary}</p><div className="mt-4 grid gap-3">{plan.updates.map((update) => <div key={update.id} className="rounded-xl bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-extrabold">{update.name}</p><p className="mt-1 text-xs text-ink/40">{update.reason}</p></div><span className="rounded-full bg-sand/50 px-2.5 py-1 text-[.65rem] font-black uppercase text-clay">Pendiente</span></div><div className="mt-3 flex flex-wrap gap-2">{Object.entries(update.changes).map(([field, after]) => <span key={field} className="rounded-lg border border-ink/8 px-3 py-2 text-xs"><strong>{labels[field] || field}:</strong> {valueLabel(update.before[field])} → <span className="font-extrabold text-forest">{valueLabel(after)}</span></span>)}</div></div>)}</div><button type="button" onClick={apply} disabled={applying} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 text-sm font-black text-white disabled:opacity-40">{applying ? <LoaderCircle className="animate-spin" size={17}/> : <Layers3 size={17}/>} {applying ? "Aplicando..." : `Confirmar cambios en ${plan.count} producto${plan.count === 1 ? "" : "s"}`}</button><p className="mt-3 text-center text-xs text-ink/40">La confirmación aplica únicamente los cambios que aparecen arriba.</p></div> : null}
      </section>

      <aside className="grid content-start gap-4"><div className="rounded-[1.5rem] bg-forest p-6 text-white"><ShieldCheck className="text-sand" size={25}/><h2 className="font-display mt-5 text-2xl">Límite de seguridad</h2><p className="mt-3 text-sm leading-6 text-white/60">Una orden de IA nunca modifica más de 20 productos de una sola vez. Para continuar con más, se genera otra vista previa y otra confirmación.</p></div><div className="rounded-[1.5rem] border border-ink/8 bg-white p-6"><Layers3 size={22} className="text-clay"/><h2 className="font-display mt-4 text-2xl">Ideal para mantenimiento</h2><p className="mt-2 text-sm leading-6 text-ink/50">Visibilidad, stock, ofertas, destacados y estados pueden mantenerse sin editar producto por producto.</p></div></aside>
    </div>
  </div>;
}
