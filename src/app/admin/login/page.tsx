import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, LogIn } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import { BrandMark } from "@/components/layout/brand-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Ingresar al panel",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ error?: string; setup?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const configured = isSupabaseConfigured();
  const message =
    query.error === "credentials"
      ? "El email o la contraseña no son correctos."
      : query.error === "not-authorized"
        ? "La cuenta ingresada no tiene permisos de administración."
        : null;

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      <section className="hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 font-display text-2xl font-black tracking-[.12em]">
          <BrandMark className="size-11" />
          ORQELIS
        </div>
        <div className="my-auto max-w-xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-sand">Panel de ventas</p>
          <h1 className="font-display mt-4 text-6xl font-extrabold leading-[1.02]">Tu catálogo, siempre al día.</h1>
          <p className="mt-5 text-base leading-7 text-white/60">Publicá productos, actualizá precios y administrá la información comercial desde un solo lugar.</p>
        </div>
        <p className="text-xs text-white/35">Acceso exclusivo para administradores autorizados.</p>
      </section>
      <section className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Link href="/" className="focus-ring mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-ink/55">
            <ArrowLeft size={17} /> Volver a la tienda
          </Link>
          <div className="rounded-[1.8rem] border border-ink/8 bg-white p-6 shadow-xl shadow-ink/5 sm:p-9">
            <span className="grid size-12 place-items-center rounded-2xl bg-sage text-forest"><LockKeyhole size={22} /></span>
            <h1 className="font-display mt-6 text-4xl font-extrabold">Ingresar</h1>
            <p className="mt-2 text-sm leading-6 text-ink/52">Usá la cuenta administrativa creada en Supabase.</p>
            {!configured || query.setup ? (
              <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <strong className="block">Falta conectar Supabase</strong>
                Completá las variables de entorno y seguí la guía del README.
              </div>
            ) : null}
            {message ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{message}</p> : null}
            <form action={loginAction} className="mt-7 grid gap-5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/55">
                Email
                <input type="email" name="email" autoComplete="email" required disabled={!configured} className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-ink/12 px-4 text-sm normal-case tracking-normal disabled:bg-ink/5" />
              </label>
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/55">
                Contraseña
                <input type="password" name="password" autoComplete="current-password" required disabled={!configured} className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-ink/12 px-4 text-sm normal-case tracking-normal disabled:bg-ink/5" />
              </label>
              <button type="submit" disabled={!configured} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">
                <LogIn size={18} /> Entrar al panel
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
