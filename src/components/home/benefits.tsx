import { CreditCard, MapPin, PackageCheck, Truck } from "lucide-react";

const benefits = [
  { icon: PackageCheck, title: "Entregas rápidas", text: "Coordinamos el punto y horario que te quede mejor." },
  { icon: CreditCard, title: "Opciones de pago", text: "Contado y alternativas de financiación informadas en cada producto." },
  { icon: MapPin, title: "Múltiples puntos", text: "Una red de puntos de encuentro en Zona Sur y CABA." },
  { icon: Truck, title: "Todo el país", text: "Despachamos tu compra a cualquier provincia de Argentina." },
];

export function Benefits() {
  return (
    <div className="grid gap-px overflow-hidden rounded-[1.7rem] border border-ink/8 bg-ink/8 sm:grid-cols-2 lg:grid-cols-4">
      {benefits.map(({ icon: Icon, title, text }) => (
        <article key={title} className="bg-white p-6 sm:p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage text-forest"><Icon size={21} strokeWidth={1.8} /></span>
          <h3 className="mt-5 text-base font-extrabold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/55">{text}</p>
        </article>
      ))}
    </div>
  );
}
