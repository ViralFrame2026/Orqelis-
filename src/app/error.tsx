"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="container-store grid min-h-[60vh] place-items-center py-20 text-center"><div><AlertCircle className="mx-auto text-clay" size={42} /><h1 className="font-display mt-5 text-4xl">Algo no salió como esperábamos</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/55">Probá de nuevo. Si el problema continúa, podés escribirnos por WhatsApp.</p><button type="button" onClick={reset} className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white"><RotateCcw size={17} /> Reintentar</button></div></div>;
}
