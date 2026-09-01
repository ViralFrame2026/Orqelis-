"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "@/components/store/product-grid";
import type { Category, Product, ProductFilters } from "@/types";

const initialFilters: ProductFilters = { sort: "newest" };

export function ProductsExplorer({ products, categories, phone, baseUrl, initialOffer = false, initialCategory }: { products: Product[]; categories: Category[]; phone: string; baseUrl: string; initialOffer?: boolean; initialCategory?: string }) {
  const [filters, setFilters] = useState<ProductFilters>({ ...initialFilters, offersOnly: initialOffer, category: initialCategory });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(filters.query || "");

  const visibleProducts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("es");
    const filtered = products.filter((product) => {
      const searchText = [product.name, product.category.name, product.description, product.short_description, ...product.tags].join(" ").toLocaleLowerCase("es");
      if (normalizedQuery && !searchText.includes(normalizedQuery)) return false;
      if (filters.category && product.category.slug !== filters.category) return false;
      if (filters.minPrice && product.price < filters.minPrice) return false;
      if (filters.maxPrice && product.price > filters.maxPrice) return false;
      if (filters.offersOnly && !product.offer) return false;
      if (filters.featuredOnly && !product.featured) return false;
      if (filters.availableOnly && !["available", "last_units"].includes(product.status)) return false;
      return true;
    });

    return filtered.toSorted((a, b) => {
      if (filters.sort === "price-asc") return a.price - b.price;
      if (filters.sort === "price-desc") return b.price - a.price;
      if (filters.sort === "featured") return Number(b.featured) - Number(a.featured);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, filters, deferredQuery]);

  const clearFilters = () => setFilters({ ...initialFilters });
  const filterPanel = (
    <div className="grid gap-5">
      <div>
        <label htmlFor="category" className="text-xs font-extrabold uppercase tracking-wider text-ink/55">Categoría</label>
        <select id="category" value={filters.category || ""} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value || undefined }))} className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-ink/12 bg-white px-3 text-sm font-semibold">
          <option value="">Todas</option>
          {categories.filter((category) => category.slug !== "ofertas").map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-ink/55">Precio mínimo<input type="number" inputMode="numeric" min="0" placeholder="$ 0" value={filters.minPrice || ""} onChange={(event) => setFilters((current) => ({ ...current, minPrice: Number(event.target.value) || undefined }))} className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-ink/12 bg-white px-3 text-sm font-semibold" /></label>
        <label className="text-xs font-extrabold uppercase tracking-wider text-ink/55">Precio máximo<input type="number" inputMode="numeric" min="0" placeholder="Sin límite" value={filters.maxPrice || ""} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) || undefined }))} className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-ink/12 bg-white px-3 text-sm font-semibold" /></label>
      </div>
      <div className="grid gap-3">
        {[ ["offersOnly", "Solo ofertas"], ["featuredOnly", "Destacados"], ["availableOnly", "Disponibles ahora"] ].map(([key, label]) => (
          <label key={key} className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl bg-white px-3 text-sm font-bold">
            {label}
            <input type="checkbox" checked={Boolean(filters[key as keyof ProductFilters])} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.checked }))} className="size-4 accent-clay" />
          </label>
        ))}
      </div>
      <button type="button" onClick={clearFilters} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/12 text-sm font-extrabold text-ink/68 hover:bg-white"><X size={16} /> Limpiar filtros</button>
    </div>
  );

  return (
    <div>
      <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" />
          <input type="search" value={filters.query || ""} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Buscar productos..." className="focus-ring min-h-14 w-full rounded-2xl border border-ink/10 bg-white pl-12 pr-4 text-base shadow-sm placeholder:text-ink/36" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="button" onClick={() => setMobileFiltersOpen((value) => !value)} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-ink/12 bg-white px-4 text-sm font-extrabold lg:hidden"><SlidersHorizontal size={17} /> Filtros</button>
          <label className="sr-only" htmlFor="sort">Ordenar</label>
          <select id="sort" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as ProductFilters["sort"] }))} className="focus-ring min-h-12 rounded-xl border border-ink/12 bg-white px-3 text-sm font-bold sm:min-w-44">
            <option value="newest">Más recientes</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="featured">Destacados</option>
          </select>
        </div>
      </div>
      {mobileFiltersOpen ? <div className="mb-6 rounded-2xl bg-cream p-4 lg:hidden">{filterPanel}</div> : null}
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden self-start rounded-[1.4rem] bg-cream p-5 lg:block"><div className="mb-5 flex items-center gap-2 font-extrabold"><SlidersHorizontal size={18} /> Filtrar catálogo</div>{filterPanel}</aside>
        <div>
          <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-ink/55">{visibleProducts.length} {visibleProducts.length === 1 ? "producto" : "productos"}</p>{deferredQuery ? <p className="max-w-[55%] truncate text-xs text-ink/46">Resultados para “{deferredQuery}”</p> : null}</div>
          <ProductGrid products={visibleProducts} phone={phone} baseUrl={baseUrl} />
        </div>
      </div>
    </div>
  );
}
