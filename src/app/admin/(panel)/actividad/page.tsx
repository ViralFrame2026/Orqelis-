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
};

const SOURCE_LABELS: Record<string, string> = {
  admin_panel: "Panel",
  api: "API",
  ai: "IA autorizada",
};

export default async function AdminActivityPage() {
  const supabase = await createClient();
  const { data: activity = [] } = supabase
    ? await supabase
        .from("admin_activity_log")
        .select("id,action,entity_type,entity_id,source,summary,created_at")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[.16em] text-clay">Auditoría</p>
      <h1 className="font-display mt-2 text-4xl">Actividad administrativa</h1>
      <p className="mt-2 text-sm text-ink/48">Últimos cambios realizados desde el panel o la API segura.</p>
      <div className="mt-7 overflow-hidden rounded-[1.4rem] border border-ink/8 bg-white">
        <div className="hidden grid-cols-[1fr_.7fr_1.5fr_.8fr] gap-4 border-b border-ink/8 bg-[#f8f6f2] px-5 py-3 text-[.64rem] font-black uppercase tracking-wider text-ink/44 md:grid">
          <span>Acción</span><span>Origen</span><span>Resumen</span><span>Fecha</span>
        </div>
        <div className="divide-y divide-ink/8">
          {(activity ?? []).map((item) => (
            <article key={item.id} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_.7fr_1.5fr_.8fr] md:items-center md:gap-4">
              <p className="text-sm font-extrabold">{ACTION_LABELS[item.action] ?? item.action}</p>
              <p><span className="rounded-full bg-cream px-2.5 py-1 text-[.64rem] font-black uppercase text-ink/55">{SOURCE_LABELS[item.source] ?? item.source}</span></p>
              <p className="truncate text-xs font-semibold text-ink/48">{JSON.stringify(item.summary)}</p>
              <p className="text-xs font-bold text-ink/38">{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(item.created_at))}</p>
            </article>
          ))}
          {!activity?.length ? <p className="px-6 py-14 text-center text-sm font-bold text-ink/42">Todavía no hay actividad registrada.</p> : null}
        </div>
      </div>
    </div>
  );
}
