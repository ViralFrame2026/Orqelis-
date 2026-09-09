import { Bot, CheckCircle2, Clock3, History, Package, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const ACTION_LABELS: Record<string, string> = {
  product_created: "Producto creado",
  product_updated: "Producto actualizado",
  product_archived: "Producto archivado",
  price_changed: "Precio modificado",
  stock_changed: "Stock modificado",
  category_created: "Categoría creada",
  category_updated: "Categoría actualizada",
  category_deleted: "Categoría eliminada",
  settings_updated: "Configuración actualizada",
  images_uploaded: "Imágenes cargadas",
  ai_product_published: "IA publicó un producto",
  ai_product_edited: "IA modificó un producto",
  ai_bulk_edited: "IA ejecutó una operación masiva",
};

const SOURCE_LABELS: Record<string, string> = {
  admin_panel: "Panel",
  api: "API",
  ai: "ORQELIS AI",
};

const FIELD_LABELS: Record<string, string> = {
  name: "nombre",
  category: "categoría",
  short_description: "descripción corta",
  description: "descripción",
  price: "precio",
  previous_price: "precio anterior",
  installments: "cuotas",
  installment_price: "valor de cuota",
  stock: "stock",
  status: "visibilidad",
  featured: "destacado",
  offer: "oferta",
  is_new: "nuevo",
  tags: "etiquetas",
  features: "características",
};

type Summary = Record<string, unknown>;

function asSummary(value: unknown): Summary {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Summary : {};
}

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function describe(action: string, summary: Summary) {
  if (action === "ai_product_published") {
    return `${text(summary.product)} · $${Number(summary.price || 0).toLocaleString("es-AR")} · stock ${text(summary.stock)}`;
  }
  if (action === "ai_product_edited") {
    const fields = Array.isArray(summary.fields) ? summary.fields.map((field) => FIELD_LABELS[String(field)] ?? String(field)) : [];
    return `${text(summary.product)}${fields.length ? ` · ${fields.join(", ")}` : ""}`;
  }
  if (action === "ai_bulk_edited") {
    const fields = Array.isArray(summary.fields) ? summary.fields.map((field) => FIELD_LABELS[String(field)] ?? String(field)) : [];
    return `${text(summary.modified)} modificados${summary.failed ? ` · ${text(summary.failed)} con error` : ""}${fields.length ? ` · ${fields.join(", ")}` : ""}`;
  }
  if (action === "price_changed") return `De $${Number(summary.from || 0).toLocaleString("es-AR")} a $${Number(summary.to || 0).toLocaleString("es-AR")}`;
  if (action === "stock_changed") return `De ${text(summary.from)} a ${text(summary.to)}`;
  if (summary.name) return text(summary.name);
  return Object.keys(summary).length ? JSON.stringify(summary) : "Sin detalles adicionales";
}

export default async function AdminActivityPage() {
  const supabase = await createClient();
  const { data: activity = [] } = supabase
    ? await supabase
        .from("admin_activity_log")
        .select("id,action,entity_type,entity_id,source,summary,created_at")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  const items = activity ?? [];
  const aiItems = items.filter((item) => item.source === "ai");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
  const aiToday = aiItems.filter((item) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(item.created_at)) === today).length;
  const aiSuccessful = aiItems.filter((item) => ["ai_product_published", "ai_product_edited", "ai_bulk_edited", "product_created", "product_updated", "price_changed", "stock_changed", "images_uploaded"].includes(item.action)).length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-forest"><History size={14}/> Auditoría</div>
          <h1 className="font-display mt-4 text-4xl sm:text-5xl">Historial de ORQELIS</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/52">Cada publicación, edición y operación masiva deja trazabilidad. Así podés verificar qué hizo la IA y qué cambió realmente en el catálogo.</p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/8 bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.12em] text-ink/40">Acciones IA</p><Bot size={18} className="text-clay"/></div><p className="font-display mt-3 text-3xl">{aiItems.length}</p><p className="mt-1 text-xs text-ink/42">registradas en el historial reciente</p></div>
        <div className="rounded-2xl border border-ink/8 bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.12em] text-ink/40">Hoy</p><Clock3 size={18} className="text-clay"/></div><p className="font-display mt-3 text-3xl">{aiToday}</p><p className="mt-1 text-xs text-ink/42">acciones de ORQELIS AI</p></div>
        <div className="rounded-2xl border border-ink/8 bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.12em] text-ink/40">Trazadas</p><CheckCircle2 size={18} className="text-forest"/></div><p className="font-display mt-3 text-3xl">{aiSuccessful}</p><p className="mt-1 text-xs text-ink/42">acciones con resultado registrado</p></div>
      </div>

      <section className="mt-7 overflow-hidden rounded-[1.6rem] border border-ink/8 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 bg-[#fbfaf7] px-5 py-4 sm:px-6"><div><p className="font-extrabold">Actividad reciente</p><p className="mt-1 text-xs text-ink/42">Últimos 200 eventos administrativos</p></div><span className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-[.68rem] font-black uppercase tracking-[.1em] text-forest"><Sparkles size={13}/> IA identificada</span></div>
        <div className="divide-y divide-ink/8">
          {items.map((item) => {
            const summary = asSummary(item.summary);
            const isAi = item.source === "ai";
            return (
              <article key={item.id} className={`grid gap-3 px-5 py-5 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center ${isAi ? "bg-sage/12" : ""}`}>
                <div className={`grid size-11 place-items-center rounded-2xl ${isAi ? "bg-forest text-white" : "bg-cream text-ink/55"}`}>{isAi ? <Bot size={19}/> : <Package size={18}/>}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold">{ACTION_LABELS[item.action] ?? item.action}</p><span className={`rounded-full px-2.5 py-1 text-[.62rem] font-black uppercase tracking-[.08em] ${isAi ? "bg-forest/10 text-forest" : "bg-cream text-ink/50"}`}>{SOURCE_LABELS[item.source] ?? item.source}</span></div><p className="mt-1 truncate text-xs font-semibold text-ink/50">{describe(item.action, summary)}</p>{item.entity_id ? <p className="mt-1 text-[.68rem] font-bold text-ink/30">ID {item.entity_id}</p> : null}</div>
                <p className="text-xs font-bold text-ink/38">{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(item.created_at))}</p>
              </article>
            );
          })}
          {!items.length ? <p className="px-6 py-14 text-center text-sm font-bold text-ink/42">Todavía no hay actividad registrada.</p> : null}
        </div>
      </section>
    </div>
  );
}
