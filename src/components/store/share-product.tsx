"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareProduct({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text: `Mirá este producto: ${title}`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button type="button" onClick={share} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/12 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-clay/30" aria-live="polite">
      {copied ? <Check size={17} className="text-[#208449]" /> : <Share2 size={17} />}
      {copied ? "Enlace copiado" : "Compartir producto"}
    </button>
  );
}
