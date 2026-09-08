import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return <div className="container-store grid min-h-[60vh] place-items-center py-20 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-cream text-clay"><SearchX size={30} /></span><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-clay">Error 404</p><h1 className="font-display mt-3 text-4xl sm:text-5xl">No encontramos esa página</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink/55">Puede que el producto ya no esté publicado o que el enlace haya cambiado.</p><Link href="/productos" className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white"><ArrowLeft size={17} /> Volver al catálogo</Link></div></div>;
}
