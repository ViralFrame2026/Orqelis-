"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Bot, Camera, CheckCircle2, LoaderCircle, PackagePlus, PencilLine, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

type Draft = {
  name: string; category: string; short_description: string; description: string; price: number;
  previous_price: number | null; installments: number | null; installment_price: number | null;
  stock: number | null; status: string; featured: boolean; offer: boolean; is_new: boolean;
  tags: string[]; features: string[]; images: unknown[]; sku: string | null;
};

type PlanResult = { draft: Draft; warnings: string[]; can_create: boolean; has_image: boolean };
type EditPlan = {
  target: { id: string; name: string; price: number; stock: number | null; status: string; featured: boolean; offer: boolean };
  changes: Record<string, unknown>;
  summary: string;
  changed_fields: string[];
};

const fieldLabels: Record<string, string> = {
  name: "Nombre", category: "Categoría", short_description: "Descripción corta", description: "Descripción",
  price: "Precio", previous_price: "Precio anterior", stock: "Stock", status: "Estado",
  featured: "Destacado", offer: "Oferta", is_new: "Nuevo", tags: "Etiquetas", features: "Características",
};

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (value === null) return "Sin definir";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function OrqelisAssistantPage() {
  const [command, setCommand] = useState("Publicá este producto a $55.000, stock 5, hacé una descripción y destacalo.");
  const [image, setImage] = useState<File | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editCommand, setEditCommand] = useState("Subile el stock a 12 al termo y dejalo destacado.");
  const [editPlan, setEditPlan] = useState<EditPlan | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editApplying, setEditApplying] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const imageUrl = useMemo(() => image ? URL.createObjectURL(image) : "", [image]);

  async function prepare(event: FormEvent) {
    event.preventDefault();
    if (!command.trim() || loading) return;
    setLoading(true); setError(""); setSuccess(""); setPlan(null);
    const body = new FormData(); body.append("command", command.trim()); if (image) body.append("image", image);
    try {
      const response = await fetch("/api/admin-ai/plan", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No pude preparar la ficha.");
      setPlan(payload as PlanResult);
    } catch (err) { setError(err instanceof Error ? err.message : "No pude preparar la ficha."); }
    finally { setLoading(false); }
  }

  async function publish() {
    if (!plan || publishing || !plan.can_create) return;
    setPublishing(true); setError(""); setSuccess("");
    const body = new FormData(); body.append("draft", JSON.stringify(plan.draft)); if (image) body.append("image", image);
    try {
      const response = await fetch("/api/admin-ai/publish", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No pude publicar el producto.");
      setSuccess(payload.message || "Producto publicado correctamente."); setPlan(null); setCommand(""); setImage(null);
    } catch (err) { setError(err instanceof Error ? err.message : "No pude publicar el producto."); }
    finally { setPublishing(false); }
  }

  async function prepareEdit(event: FormEvent) {
    event.preventDefault();
    if (!editCommand.trim() || editLoading) return;
    setEditLoading(true); setEditError(""); setEditSuccess(""); setEditPlan(null);
    try {
      const response = await fetch("/api/admin-ai/edit-plan", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: editCommand.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No pude preparar el cambio.");
      setEditPlan(payload as EditPlan);
    } catch (err) { setEditError(err instanceof Error ? err.message : "No pude preparar el cambio."); }
    finally { setEditLoading(false); }
  }

  async function applyEdit() {
    if (!editPlan || editApplying) return;
    setEditApplying(true); setEditError(""); setEditSuccess("");
    try {
      const response = await fetch("/api/admin-ai/edit-apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: editPlan.target.id, changes: editPlan.changes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No pude aplicar los cambios.");
      setEditSuccess(payload.message || "Cambios aplicados correctamente."); setEditPlan(null); setEditCommand("");
    } catch (err) { setEditError(err instanceof Error ? err.message : "No pude aplicar los cambios."); }
    finally { setEditApplying(false); }
  }

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-forest"><Sparkles size={14}/> ORQELIS AI</div><h1 className="font-display mt-4 text-4xl sm:text-5xl">Administrá el catálogo hablando.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">Creá productos desde una foto o modificá productos existentes con instrucciones naturales. ORQELIS siempre muestra una vista previa antes de escribir en el catálogo.</p></div><Link href="/admin/productos" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold">Ver catálogo <ArrowRight size={16}/></Link></div>

    <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-[1.6rem] border border-ink/8 bg-white shadow-sm">
        <div className="border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-ink text-white"><Bot size={21}/></span><div><p className="font-extrabold">Crear producto con IA</p><p className="text-xs text-ink/42">Foto real · ficha automática · confirmación</p></div></div></div>
        <div className="p-5 sm:p-7">
          <form onSubmit={prepare} className="grid gap-5">
            <label className="group relative grid min-h-48 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/10 bg-[#fbfaf7] p-4 text-center hover:border-clay/35">
              {imageUrl ? <img src={imageUrl} alt="Producto a publicar" className="absolute inset-0 h-full w-full object-contain p-3"/> : <div><Camera className="mx-auto text-clay"/><p className="mt-3 text-sm font-extrabold">Adjuntar foto del producto</p><p className="mt-1 text-xs text-ink/40">JPG, PNG o WEBP · esta misma foto será la publicada</p></div>}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { setImage(e.target.files?.[0] || null); setPlan(null); setSuccess(""); }}/>
            </label>
            <div className="rounded-2xl border-2 border-dashed border-ink/10 p-5"><label className="text-xs font-black uppercase tracking-[.12em] text-ink/45">Tu pedido</label><textarea value={command} onChange={(e) => { setCommand(e.target.value); setPlan(null); }} rows={4} className="mt-3 w-full resize-none bg-transparent text-sm outline-none"/><div className="mt-3 flex justify-end"><button disabled={loading || !command.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:opacity-40">{loading ? <LoaderCircle className="animate-spin" size={16}/> : <WandSparkles size={16}/>} {loading ? "Analizando..." : "Preparar publicación"}</button></div></div>
          </form>
          {error ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
          {success ? <div className="mt-5 rounded-2xl bg-sage p-4 text-sm font-extrabold text-forest">{success}</div> : null}
          {plan ? <div className="mt-6 rounded-2xl border border-forest/15 bg-sage/30 p-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-forest"><CheckCircle2 size={15}/> Ficha lista para revisar</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white p-4"><p className="text-xs text-ink/40">Producto</p><p className="mt-1 font-extrabold">{plan.draft.name}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-ink/40">Precio / stock</p><p className="mt-1 font-extrabold">${Number(plan.draft.price).toLocaleString("es-AR")} · {plan.draft.stock ?? "sin definir"}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-ink/40">Categoría</p><p className="mt-1 font-extrabold">{plan.draft.category}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-ink/40">Estado</p><p className="mt-1 font-extrabold">{plan.draft.status} {plan.draft.featured ? "· destacado" : ""}</p></div></div><div className="mt-3 rounded-xl bg-white p-4"><p className="text-xs text-ink/40">Descripción generada</p><p className="mt-2 text-sm leading-6 text-ink/65">{plan.draft.description}</p></div>{plan.warnings?.length ? <div className="mt-3 rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-800">{plan.warnings.join(" · ")}</div> : null}<button type="button" onClick={publish} disabled={!plan.can_create || publishing || plan.draft.price <= 0} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 text-sm font-black text-white disabled:opacity-40">{publishing ? <LoaderCircle className="animate-spin" size={17}/> : <PackagePlus size={17}/>} {publishing ? "Publicando..." : "Confirmar y publicar"}</button></div> : null}
        </div>
      </section>

      <aside className="grid content-start gap-4"><div className="rounded-[1.5rem] bg-forest p-6 text-white"><ShieldCheck className="text-sand" size={25}/><h2 className="font-display mt-5 text-2xl">Control antes de ejecutar</h2><p className="mt-3 text-sm leading-6 text-white/60">Crear o modificar siempre requiere una confirmación visible. La IA no aplica cambios silenciosos.</p></div><div className="rounded-[1.5rem] border border-ink/8 bg-white p-6"><Camera size={22} className="text-clay"/><h2 className="font-display mt-4 text-2xl">La foto se conserva</h2><p className="mt-2 text-sm leading-6 text-ink/50">La imagen adjunta se analiza y después se guarda como imagen principal real del producto.</p></div></aside>
    </div>

    <section className="mt-6 rounded-[1.6rem] border border-ink/8 bg-white shadow-sm">
      <div className="border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-clay text-white"><PencilLine size={20}/></span><div><p className="font-extrabold">Editar productos hablando</p><p className="text-xs text-ink/42">Busca el producto real · propone cambios · confirma antes de aplicar</p></div></div></div>
      <div className="p-5 sm:p-7">
        <div className="grid gap-2 sm:grid-cols-3">{["Subile el stock a 12 al termo.", "Poné el producto más barato como destacado.", "Ocultá el termo pero no cambies su precio."].map((example) => <button key={example} type="button" onClick={() => { setEditCommand(example); setEditPlan(null); setEditError(""); setEditSuccess(""); }} className="rounded-xl border border-ink/8 p-3 text-left text-xs font-semibold leading-5 text-ink/55 hover:border-clay/35 hover:bg-sand/20">“{example}”</button>)}</div>
        <form onSubmit={prepareEdit} className="mt-5 rounded-2xl border-2 border-dashed border-ink/10 p-5"><label className="text-xs font-black uppercase tracking-[.12em] text-ink/45">Qué querés cambiar</label><textarea value={editCommand} onChange={(e) => { setEditCommand(e.target.value); setEditPlan(null); }} rows={4} placeholder="Ej: Al termo de acero subile el stock a 15 y marcálo como destacado." className="mt-3 w-full resize-none bg-transparent text-sm outline-none"/><div className="mt-3 flex justify-end"><button disabled={editLoading || !editCommand.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:opacity-40">{editLoading ? <LoaderCircle className="animate-spin" size={16}/> : <WandSparkles size={16}/>} {editLoading ? "Buscando..." : "Preparar cambio"}</button></div></form>
        {editError ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{editError}</div> : null}
        {editSuccess ? <div className="mt-5 rounded-2xl bg-sage p-4 text-sm font-extrabold text-forest">{editSuccess}</div> : null}
        {editPlan ? <div className="mt-5 rounded-2xl border border-clay/15 bg-sand/25 p-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-clay"><CheckCircle2 size={15}/> Cambio preparado</div><h3 className="font-display mt-2 text-2xl">{editPlan.target.name}</h3><p className="mt-2 text-sm text-ink/55">{editPlan.summary}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(editPlan.changes).map(([field, value]) => <div key={field} className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase tracking-[.08em] text-ink/35">{fieldLabels[field] || field}</p><p className="mt-1 text-sm font-extrabold text-ink/70">{displayValue(value)}</p></div>)}</div><div className="mt-4 rounded-xl bg-white/80 p-4 text-xs text-ink/55"><strong>Estado actual:</strong> precio ${Number(editPlan.target.price).toLocaleString("es-AR")} · stock {editPlan.target.stock ?? "sin definir"} · {editPlan.target.status} · destacado {editPlan.target.featured ? "sí" : "no"} · oferta {editPlan.target.offer ? "sí" : "no"}</div><button type="button" onClick={applyEdit} disabled={editApplying} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-clay px-5 text-sm font-black text-white disabled:opacity-40">{editApplying ? <LoaderCircle className="animate-spin" size={17}/> : <PencilLine size={17}/>} {editApplying ? "Aplicando..." : "Confirmar y aplicar cambios"}</button><p className="mt-3 text-center text-xs text-ink/40">Nada cambia hasta que confirmás este paso.</p></div> : null}
      </div>
    </section>
  </div>;
}
