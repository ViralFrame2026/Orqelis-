"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, Eye, PackagePlus, Search, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

type Preview = {
  title: string;
  summary: string;
  steps: string[];
  safety: string;
};

const examples = [
  "Mostrame qué productos están publicados.",
  "Ocultá todos los productos sin stock.",
  "Prepará una oferta para un producto sin cambiar su precio actual.",
  "Agregá un termo a $55.000, stock 5 y destacalo.",
];

function preparePreview(command: string): Preview {
  const text = command.toLocaleLowerCase("es");
  if (/mostr|ver|list|cu[aá]l|publicad|visible/.test(text)) return {
    title: "Consulta de catálogo",
    summary: "ORQELIS puede consultar el catálogo sin modificar ningún dato.",
    steps: ["Buscar productos que coincidan con el pedido", "Mostrar estado, precio y stock", "No ejecutar cambios"],
    safety: "Acción de solo lectura.",
  };
  if (/ocult|archiv|elimin|borr/.test(text)) return {
    title: "Cambio sensible detectado",
    summary: "La orden puede quitar productos de la vista pública. Requiere selección y confirmación antes de ejecutarse.",
    steps: ["Identificar productos afectados", "Mostrar una vista previa con la cantidad exacta", "Solicitar confirmación", "Aplicar el cambio mediante la API administrativa"],
    safety: "No se ejecutó ningún cambio.",
  };
  if (/oferta|descuent|precio/.test(text)) return {
    title: "Preparar cambio comercial",
    summary: "La orden involucra precios u ofertas y se preparará como una propuesta revisable.",
    steps: ["Encontrar el producto o grupo objetivo", "Calcular los campos que cambiarían", "Comparar precio actual y propuesto", "Solicitar confirmación antes de publicar"],
    safety: "Los precios no se modifican sin confirmación.",
  };
  if (/agreg|cre|public|sub/.test(text)) return {
    title: "Alta de producto",
    summary: "ORQELIS preparará una ficha nueva y validará los datos obligatorios antes de crearla.",
    steps: ["Extraer nombre, precio, stock y categoría", "Preparar descripción, estado y destacado", "Validar la ficha con la API de preview", "Solicitar confirmación para crear"],
    safety: "La creación todavía no fue ejecutada.",
  };
  return {
    title: "Pedido recibido",
    summary: "La orden necesita interpretación adicional antes de convertirse en una acción de catálogo.",
    steps: ["Interpretar la intención", "Determinar productos afectados", "Preparar una vista previa", "Pedir confirmación si existe una escritura"],
    safety: "No se ejecutó ningún cambio.",
  };
}

export default function OrqelisAssistantPage() {
  const [command, setCommand] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    setPreview(preparePreview(value));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-forest"><Sparkles size={14} /> ORQELIS AI</div><h1 className="font-display mt-4 text-4xl sm:text-5xl">Administrá tu tienda hablando.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">Escribí una orden como se la darías a una persona. ORQELIS primero interpreta y prepara el plan; las escrituras sensibles quedan bloqueadas hasta su confirmación.</p></div>
        <Link href="/admin/productos" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold">Ver catálogo <ArrowRight size={16} /></Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_.55fr]">
        <section className="overflow-hidden rounded-[1.6rem] border border-ink/8 bg-white shadow-sm">
          <div className="border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-ink text-white"><Bot size={21} /></span><div><p className="font-extrabold">Asistente de catálogo</p><p className="text-xs text-ink/42">Modo seguro · previsualización primero</p></div></div></div>
          <div className="p-5 sm:p-7">
            <div className="rounded-2xl bg-[#f4f1ec] p-5 text-sm leading-6 text-ink/65"><strong className="text-ink">ORQELIS AI</strong><br />Decime qué querés hacer. Podés consultar el catálogo o preparar altas, stock, visibilidad, ofertas y destacados.</div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{examples.map((example) => <button type="button" key={example} onClick={() => { setCommand(example); setPreview(null); }} className="focus-ring rounded-xl border border-ink/8 p-3 text-left text-xs font-semibold leading-5 text-ink/55 transition hover:border-clay/35 hover:bg-sand/20">“{example}”</button>)}</div>
            <form onSubmit={submit} className="mt-6 rounded-2xl border-2 border-dashed border-ink/10 p-5"><label htmlFor="assistant-command" className="text-xs font-black uppercase tracking-[.12em] text-ink/45">Tu pedido</label><textarea id="assistant-command" value={command} onChange={(event) => { setCommand(event.target.value); setPreview(null); }} rows={5} placeholder="Ej: Agregá este producto a $55.000, stock 5 y dejalo destacado..." className="mt-3 w-full resize-none bg-transparent text-sm outline-none placeholder:text-ink/28" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-ink/38">Esta etapa interpreta la intención sin escribir en la base.</p><button disabled={!command.trim()} className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35"><WandSparkles size={16} /> Preparar acción</button></div></form>

            {preview ? <div className="mt-5 rounded-2xl border border-forest/15 bg-sage/35 p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-forest"><Eye size={18} /></span><div><p className="text-xs font-black uppercase tracking-[.12em] text-forest/60">Vista previa</p><h2 className="font-display mt-1 text-2xl text-forest">{preview.title}</h2><p className="mt-2 text-sm leading-6 text-ink/60">{preview.summary}</p></div></div><div className="mt-4 grid gap-2">{preview.steps.map((step, index) => <div key={step} className="flex items-start gap-2 rounded-xl bg-white/75 p-3 text-xs font-semibold text-ink/60"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest text-[.62rem] font-black text-white">{index + 1}</span>{step}</div>)}</div><div className="mt-4 flex items-center gap-2 text-xs font-extrabold text-forest"><CheckCircle2 size={15} /> {preview.safety}</div></div> : null}
          </div>
        </section>

        <aside className="grid content-start gap-4"><div className="rounded-[1.5rem] bg-forest p-6 text-white"><ShieldCheck className="text-sand" size={25} /><h2 className="font-display mt-5 text-2xl">Control antes de ejecutar</h2><p className="mt-3 text-sm leading-6 text-white/58">Las operaciones sensibles muestran qué cambiará antes de tocar el catálogo.</p><div className="mt-5 flex items-center gap-2 text-xs font-bold text-white/65"><CheckCircle2 size={15} /> Vista previa primero</div></div><div className="rounded-[1.5rem] border border-ink/8 bg-white p-6"><PackagePlus size={22} className="text-clay" /><h2 className="font-display mt-4 text-2xl">API preparada</h2><p className="mt-2 text-sm leading-6 text-ink/50">Productos, operaciones masivas, categorías, importaciones y uploads ya tienen endpoints administrativos. El siguiente paso conecta estas intenciones con datos reales.</p><div className="mt-4 flex items-center gap-2 text-xs font-bold text-ink/45"><Search size={15} /> Próximo: consulta real del catálogo</div></div></aside>
      </div>
    </div>
  );
}
