"use client";

import { Archive, Copy, Eye, EyeOff, Pencil } from "lucide-react";
import Link from "next/link";
import { deleteProductAction, duplicateProductAction, toggleProductVisibilityAction } from "@/app/admin/actions";

export function AdminProductActions({ id, hidden, archived }: { id: string; hidden: boolean; archived: boolean }) {
  return <div className="flex flex-wrap gap-1.5">
    <Link href={`/admin/productos/${id}/editar`} className="focus-ring grid size-9 place-items-center rounded-lg border border-ink/10 bg-white text-ink/60 hover:text-clay" title="Editar"><Pencil size={15} /></Link>
    <form action={duplicateProductAction.bind(null, id)}><button className="focus-ring grid size-9 place-items-center rounded-lg border border-ink/10 bg-white text-ink/60 hover:text-clay" title="Duplicar"><Copy size={15} /></button></form>
    {!archived ? <form action={toggleProductVisibilityAction.bind(null, id, hidden)}><button className="focus-ring grid size-9 place-items-center rounded-lg border border-ink/10 bg-white text-ink/60 hover:text-clay" title={hidden ? "Mostrar" : "Ocultar"}>{hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button></form> : null}
    {!archived ? <form action={deleteProductAction.bind(null, id)} onSubmit={(event) => { if (!window.confirm("¿Archivar este producto? Dejará de verse en la tienda y conservará toda su información.")) event.preventDefault(); }}><button className="focus-ring grid size-9 place-items-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50" title="Archivar"><Archive size={15} /></button></form> : null}
  </div>;
}
