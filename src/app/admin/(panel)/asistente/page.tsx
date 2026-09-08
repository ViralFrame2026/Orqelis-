import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, PackagePlus, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

const examples = [
  "Publicá un termo a $55.000, stock 5, creá una descripción y destacalo.",
  "Ocultá todos los productos sin stock.",
  "Prepará una oferta para este producto sin cambiar su precio actual.",
  "Mostrame qué productos están publicados antes de hacer cambios.",
];

export default function OrqelisAssistantPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-forest"><Sparkles size={14} /> ORQELIS AI</div>
          <h1 className="font-display mt-4 text-4xl sm:text-5xl">Administrá tu tienda hablando.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">El espacio de trabajo para convertir pedidos en acciones de catálogo. La primera versión prioriza vista previa y confirmación antes de ejecutar cambios.</p>
        </div>
        <Link href="/admin/productos" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold">Ver catálogo <ArrowRight size={16} /></Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_.55fr]">
        <section className="overflow-hidden rounded-[1.6rem] border border-ink/8 bg-white shadow-sm">
          <div className="border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-7">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-ink text-white"><Bot size={21} /></span><div><p className="font-extrabold">Asistente de catálogo</p><p className="text-xs text-ink/42">Modo seguro · previsualización primero</p></div></div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="rounded-2xl bg-[#f4f1ec] p-5 text-sm leading-6 text-ink/65"><strong className="text-ink">ORQELIS AI</strong><br />Decime qué querés hacer con tu catálogo. Puedo ayudarte a preparar altas, cambios de precio, stock, visibilidad, ofertas y destacados.</div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{examples.map((example) => <div key={example} className="rounded-xl border border-ink/8 p-3 text-xs font-semibold leading-5 text-ink/55">“{example}”</div>)}</div>
            <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/10 p-5">
              <label htmlFor="assistant-command" className="text-xs font-black uppercase tracking-[.12em] text-ink/45">Tu pedido</label>
              <textarea id="assistant-command" disabled rows={5} placeholder="Ej: Agregá este producto a $55.000, stock 5 y dejalo destacado..." className="mt-3 w-full resize-none bg-transparent text-sm outline-none placeholder:text-ink/28 disabled:cursor-not-allowed" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-ink/38">Conexión conversacional en preparación.</p><button disabled className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-ink/35 px-4 text-sm font-extrabold text-white"><WandSparkles size={16} /> Preparar acción</button></div>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <div className="rounded-[1.5rem] bg-forest p-6 text-white"><ShieldCheck className="text-sand" size={25} /><h2 className="font-display mt-5 text-2xl">Control antes de ejecutar</h2><p className="mt-3 text-sm leading-6 text-white/58">Las operaciones sensibles se diseñan para mostrar qué cambiará antes de tocar el catálogo.</p><div className="mt-5 flex items-center gap-2 text-xs font-bold text-white/65"><CheckCircle2 size={15} /> Vista previa existente en la API</div></div>
          <div className="rounded-[1.5rem] border border-ink/8 bg-white p-6"><PackagePlus size={22} className="text-clay" /><h2 className="font-display mt-4 text-2xl">Base preparada</h2><p className="mt-2 text-sm leading-6 text-ink/50">ORQELIS ya cuenta con endpoints administrativos para productos, operaciones masivas, importaciones, categorías y cargas. Este módulo será la capa conversacional sobre esas capacidades.</p></div>
        </aside>
      </div>
    </div>
  );
}
