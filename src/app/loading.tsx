export default function Loading() {
  return <div className="container-store py-16" aria-label="Cargando"><div className="h-10 w-64 animate-pulse rounded-xl bg-cream" /><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[.76] animate-pulse rounded-[1.3rem] bg-cream" />)}</div></div>;
}
