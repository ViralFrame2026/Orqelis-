"use client";

import { FormEvent, useState } from "react";
import { Bot, CheckCircle2, Sparkles, WandSparkles } from "lucide-react";

type DemoProduct = { name: string; price: number; stock: number | null; status: string };

type Props = { products: DemoProduct[] };

const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

export function OrqelisAiDemo({ products }: Props) {
  const [command, setCommand] = useState("Mostrame qué productos están publicados");
  const [answer, setAnswer] = useState<string[]>([]);

  function run(event: FormEvent) {
    event.preventDefault();
    const text = command.trim().toLocaleLowerCase("es");
    if (!text) return;

    if (/mostr|ver|list|publicad|visible|producto/.test(text) && !/agreg|cre|sub|nuevo/.test(text)) {
      setAnswer([
        `Encontré ${products.length} productos visibles en esta demo.`,
        ...products.slice(0, 4).map((product) => `${product.name} · ${money(product.price)} · stock ${product.stock ?? "sin límite definido"}`),
        "Modo demo: consulta realizada sin modificar datos.",
      ]);
      return;
    }

    if (/ocult|sin stock|agotad/.test(text)) {
      const affected = products.filter((product) => product.stock === 0 || product.status === "sold_out");
      setAnswer([
        `Prepararía una acción sobre ${affected.length} producto${affected.length === 1 ? "" : "s"}.`,
        affected.length ? affected.map((product) => product.name).join(", ") : "No hay productos visibles sin stock en este momento.",
        "En una cuenta real, ORQELIS pediría confirmación antes de ocultarlos.",
      ]);
      return;
    }

    if (/agreg|cre|sub|nuevo|public/.test(text)) {
      const priceMatch = command.match(/\$\s?([\d\.]+)/);
      const stockMatch = command.match(/stock\s*(?:de|:)?\s*(\d+)/i);
      setAnswer([
        "Ficha detectada para alta de producto.",
        `Precio interpretado: ${priceMatch ? "$" + priceMatch[1] : "pendiente de definir"}. Stock: ${stockMatch ? stockMatch[1] : "pendiente de definir"}.`,
        "ORQELIS generaría la descripción, validaría la ficha y mostraría una vista previa antes de publicar.",
        "Modo demo: no se creó ningún producto real.",
      ]);
      return;
    }

    if (/oferta|descuent|precio/.test(text)) {
      setAnswer([
        "Detecté una modificación comercial.",
        "ORQELIS compararía precio actual, precio anterior y estado de oferta antes de aplicar el cambio.",
        "Modo demo: los precios reales permanecen intactos.",
      ]);
      return;
    }

    setAnswer([
      "Entendí el pedido y lo prepararía como una acción administrable.",
      "En la versión completa, ORQELIS identifica los productos afectados, genera una vista previa y solicita confirmación para las escrituras.",
    ]);
  }

  return (
    <section id="ia-demo" className="bg-ink py-16 text-white sm:py-24">
      <div className="container-store">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-sand"><Sparkles size={14}/> Probá ORQELIS AI</div>
          <h2 className="font-display mt-4 text-4xl sm:text-5xl">Pedile algo como si hablaras con una persona</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/60">Esta demo trabaja sobre el catálogo visible y simula de forma segura las acciones que ORQELIS podría ejecutar desde el panel real.</p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] bg-white text-ink shadow-2xl">
          <div className="flex items-center gap-3 border-b border-ink/8 bg-[#fbfaf7] p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-2xl bg-forest text-white"><Bot size={21}/></span><div><p className="font-extrabold">ORQELIS AI Demo</p><p className="text-xs text-ink/45">Catálogo real visible · acciones de escritura simuladas</p></div></div>
          <div className="p-5 sm:p-7">
            <div className="grid gap-2 sm:grid-cols-2">
              {["Mostrame qué productos están publicados", "Ocultá los productos sin stock", "Agregá un termo a $55.000, stock 5 y destacalo", "Prepará una oferta sin cambiar el precio actual"].map((example) => <button key={example} type="button" onClick={() => { setCommand(example); setAnswer([]); }} className="rounded-xl border border-ink/8 p-3 text-left text-xs font-bold leading-5 text-ink/55 transition hover:border-clay/30 hover:bg-sand/20">“{example}”</button>)}
            </div>

            <form onSubmit={run} className="mt-5 rounded-2xl border-2 border-dashed border-ink/10 p-4 sm:p-5"><textarea value={command} onChange={(event) => { setCommand(event.target.value); setAnswer([]); }} rows={4} className="w-full resize-none bg-transparent text-sm outline-none" aria-label="Pedido para ORQELIS AI"/><div className="mt-3 flex justify-end"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white"><WandSparkles size={16}/> Probar IA</button></div></form>

            {answer.length ? <div className="mt-5 rounded-2xl bg-sage/45 p-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-forest"><CheckCircle2 size={15}/> Respuesta de ORQELIS</div><div className="mt-3 grid gap-2">{answer.map((line) => <p key={line} className="rounded-xl bg-white/75 p-3 text-sm leading-6 text-ink/65">{line}</p>)}</div></div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
