"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, Boxes, ChartNoAxesCombined, History, LayoutDashboard, Menu, MessageSquareText, Settings, Tags, X } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";

const items = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/asistente", label: "ORQELIS AI", icon: Bot },
  { href: "/admin/productos", label: "Productos", icon: Boxes },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/actividad", label: "Actividad", icon: History },
  { href: "/admin/ventas", label: "Ventas", icon: ChartNoAxesCombined },
  { href: "/admin/consultas", label: "Consultas", icon: MessageSquareText },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = (
    <nav className="grid gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} className={`focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-white text-ink shadow-sm" : "text-white/60 hover:bg-white/8 hover:text-white"}`}>
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display text-xl font-black tracking-[.08em]">
          <BrandMark className="size-9" />
          ORQELIS Admin
        </Link>
        <button type="button" onClick={() => setOpen((value) => !value)} className="focus-ring grid size-10 place-items-center rounded-xl bg-white/8" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? <div className="border-b border-white/10 px-4 pb-4 lg:hidden">{links}</div> : null}
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col p-5 lg:flex">
        <Link href="/admin" className="mb-10 flex items-center gap-3 px-2 font-display text-2xl font-black tracking-[.1em]">
          <BrandMark className="size-10" />
          ORQELIS
        </Link>
        {links}
        <div className="mt-auto rounded-2xl bg-white/6 p-4 text-xs leading-5 text-white/45">
          <p className="font-bold text-white/70">ORQELIS AI</p>
          <p className="mt-1">Catálogo, contenido y automatización en un solo lugar.</p>
        </div>
      </aside>
    </>
  );
}
