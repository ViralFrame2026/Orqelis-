import { LogOut, Store } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/services/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <div className="min-h-screen bg-[#f4f1ec] lg:flex"><div className="bg-ink text-white lg:sticky lg:top-0 lg:h-screen"><AdminNav /></div><div className="min-w-0 flex-1"><header className="flex min-h-16 items-center justify-between border-b border-ink/8 bg-white px-4 sm:px-7"><div><p className="text-xs font-bold text-ink/42">Sesión administrativa</p><p className="max-w-52 truncate text-sm font-extrabold sm:max-w-none">{user.email}</p></div><div className="flex gap-2"><Link href="/" target="_blank" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink/10 px-3 text-xs font-bold text-ink/60"><Store size={16} /><span className="hidden sm:inline">Ver tienda</span></Link><form action={logoutAction}><button className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink/10 px-3 text-xs font-bold text-ink/60"><LogOut size={16} /><span className="hidden sm:inline">Salir</span></button></form></div></header><main className="mx-auto max-w-[92rem] p-4 sm:p-7">{children}</main></div></div>;
}
