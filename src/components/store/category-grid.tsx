import Link from "next/link";
import {
  BadgePercent,
  Blender,
  ChevronRight,
  CookingPot,
  CupSoda,
  Headphones,
  House,
  Package,
  Sparkles,
} from "lucide-react";
import type { Category } from "@/types";

const iconMap = {
  BadgePercent,
  Blender,
  CookingPot,
  CupSoda,
  Headphones,
  House,
  Package,
  Sparkles,
};

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {categories.map((category, index) => {
        const Icon = iconMap[category.icon as keyof typeof iconMap] || Package;
        return (
          <Link key={category.id} href={`/categoria/${category.slug}`} className={`focus-ring group relative flex min-h-44 flex-col overflow-hidden rounded-[1.4rem] border p-4 transition hover:-translate-y-1 hover:shadow-lg sm:min-h-48 ${index === categories.length - 1 ? "border-clay/20 bg-clay text-white" : "border-ink/8 bg-white text-ink"}`}>
            <span className={`grid size-11 place-items-center rounded-2xl ${index === categories.length - 1 ? "bg-white/16" : "bg-cream text-clay"}`}>
              <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="mt-auto">
              <h3 className="text-sm font-extrabold leading-tight sm:text-base">{category.name}</h3>
              <p className={`mt-1 text-xs ${index === categories.length - 1 ? "text-white/68" : "text-ink/48"}`}>{category.product_count ?? 0} {(category.product_count ?? 0) === 1 ? "producto" : "productos"}</p>
            </div>
            <ChevronRight size={17} className="absolute bottom-4 right-3 opacity-45 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
