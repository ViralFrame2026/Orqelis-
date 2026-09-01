import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2.5 rounded-xl" aria-label="ORQELIS — ir al inicio">
      <BrandMark className="size-11 shrink-0" />
      <span className="leading-none">
        <span className={`font-display block text-[1.2rem] font-black tracking-[0.12em] ${light ? "text-white" : "text-ink"}`}>ORQELIS</span>
        <span className={`mt-1 block text-[0.5rem] font-extrabold uppercase tracking-[0.2em] ${light ? "text-sand" : "text-clay"}`}>casa · bazar · regalos</span>
      </span>
    </Link>
  );
}
