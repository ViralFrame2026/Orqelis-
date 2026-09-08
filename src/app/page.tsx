import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  WandSparkles,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "ORQELIS | Comercio digital administrado con IA",
  description:
    "Tienda online, panel de administración y un asistente de IA que ejecuta tareas sobre tu negocio.",
};

const commands = [
  "Subí este producto a $55.000 y dejalo destacado.",
  "Actualizá el stock y poné estos productos en oferta.",
  "Agregales características y mejorá las descripciones.",
  "Dejá solamente estos productos publicados.",
];

const modules = [
  {
    icon: ShoppingBag,
    title: "ORQELIS Store",
    eyebrow: "Experiencia de compra",
    text: "Una tienda profesional para que tus clientes exploren productos, ofertas y compren desde cualquier dispositivo.",
  },
  {
    icon: LayoutDashboard,
    title: "ORQELIS Admin",
    eyebrow: "Control operativo",
    text: "Gestioná catálogo, imágenes, categorías, precios, stock, destacados y promociones sin tocar código.",
  },
  {
    icon: Bot,
    title: "ORQELIS AI",
    eyebrow: "Ejecución con IA",
    text: "Dale instrucciones en lenguaje natural y delegá tareas repetitivas de administración del catálogo.",
  },
];

const benefits = [
  [Zap, "Menos trabajo operativo", "Reducí pasos manuales al mantener tu catálogo."],
  [ShieldCheck, "Control y seguridad", "Las acciones sensibles pueden requerir confirmación."],
  [Sparkles, "Contenido asistido", "Organizá mejor descripciones y características de productos."],
  [Store, "Adaptable a tu marca", "Identidad, catálogo y operación configurables para cada comercio."],
] as const;

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-paper text-ink">
      <section className="relative border-b border-ink/10 bg-cream">
        <div className="pointer-events-none absolute -right-24 top-8 size-96 rounded-full bg-clay/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 size-72 rounded-full bg-sand/50 blur-3xl" />
        <div className="container-store relative grid min-h-[82vh] items-center gap-14 py-20 lg:grid-cols-[1.03fr_.97fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-clay/20 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-clay shadow-sm">
              <Sparkles size={15} /> Software para comercios + IA
            </div>
            <h1 className="font-display mt-7 max-w-4xl text-[3.15rem] leading-[.94] tracking-[-.045em] sm:text-6xl lg:text-[5.2rem]">
              Pedís.
              <br />
              <span className="text-clay">ORQELIS lo hace.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/65 sm:text-xl">
              Tienda online, panel de administración y un asistente de inteligencia artificial que transforma instrucciones simples en tareas concretas sobre tu negocio.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-ink px-6 py-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              >
                Ver demo funcionando <ArrowRight size={18} />
              </Link>
              <a
                href="#solucion"
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-ink/15 bg-white px-6 py-4 text-sm font-extrabold transition hover:border-clay/35"
              >
                Conocer la solución
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-ink/52">
              {[
                "Sin tocar código",
                "Catálogo centralizado",
                "IA con confirmaciones",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-sage text-forest">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[38rem] lg:ml-auto">
            <div className="absolute -left-4 top-12 z-10 rounded-2xl border border-ink/8 bg-white px-4 py-3 shadow-xl sm:-left-8">
              <p className="text-[.62rem] font-black uppercase tracking-[.16em] text-clay">Automatización</p>
              <p className="mt-1 text-sm font-extrabold">De pedido a acción</p>
            </div>
            <div className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_32px_90px_rgba(43,33,30,.14)] sm:p-7">
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-clay">ORQELIS AI</p>
                  <p className="mt-1 font-extrabold">Asistente del negocio</p>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-clay text-white">
                  <Bot size={23} />
                </span>
              </div>
              <div className="space-y-4 py-6">
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-ink p-4 text-sm leading-6 text-white">
                  Subí este producto. Cuesta $55.000, tengo 5 unidades y quiero que aparezca destacado.
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-sand/55 p-4 text-sm leading-6">
                  <div className="mb-2 flex items-center gap-2 font-extrabold text-clay">
                    <CheckCircle2 size={17} /> Listo
                  </div>
                  Producto preparado, organizado y publicado en la tienda.
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-ink/10 pt-4 text-center text-[11px] font-extrabold">
                <span className="rounded-xl bg-cream p-3">Producto ✓</span>
                <span className="rounded-xl bg-cream p-3">Stock ✓</span>
                <span className="rounded-xl bg-cream p-3">Destacado ✓</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-2 z-10 rounded-2xl bg-forest px-4 py-3 text-white shadow-xl sm:-right-7">
              <p className="text-[.6rem] font-bold uppercase tracking-[.15em] text-white/60">Estado</p>
              <p className="mt-0.5 inline-flex items-center gap-2 text-sm font-extrabold">
                <BadgeCheck size={16} /> Tienda actualizada
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="solucion" className="container-store py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[.2em] text-clay">Un sistema, tres piezas</p>
          <h2 className="font-display mt-3 text-4xl tracking-[-.03em] sm:text-5xl">Todo lo que el comercio necesita para operar online.</h2>
          <p className="mt-5 text-base leading-7 text-ink/60">
            ORQELIS no es solamente una tienda. Conecta la experiencia del cliente, la administración interna y la ejecución asistida por IA.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {modules.map(({ icon: Icon, title, eyebrow, text }) => (
            <article key={title} className="group rounded-[1.75rem] border border-ink/10 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-sand/55 text-clay">
                  <Icon size={23} />
                </span>
                <span className="text-[.62rem] font-black uppercase tracking-[.16em] text-ink/35">{eyebrow}</span>
              </div>
              <h3 className="font-display mt-7 text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/60">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink py-20 text-white sm:py-28">
        <div className="container-store grid gap-12 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-sand">De panel tradicional a copiloto operativo</p>
            <h2 className="font-display mt-3 text-4xl leading-[1.02] tracking-[-.03em] sm:text-5xl">
              Lo que antes eran varios pasos, ahora puede empezar con una frase.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-white/62">
              El objetivo es que administrar productos, ofertas y visibilidad requiera menos navegación y menos tareas repetitivas.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Tags, "Catálogo", "Crear, ordenar, destacar y ocultar productos."],
              [PackageCheck, "Stock", "Actualizar disponibilidad y mantener la tienda alineada."],
              [WandSparkles, "Contenido", "Asistir con descripciones, características y presentación."],
              [ClipboardCheck, "Control", "Validar acciones delicadas antes de ejecutarlas."],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Tags;
              return (
                <article key={String(title)} className="rounded-2xl border border-white/10 bg-white/[.06] p-6">
                  <I className="text-sand" size={22} />
                  <p className="mt-4 font-extrabold">{String(title)}</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">{String(text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-forest py-20 text-white sm:py-28">
        <div className="container-store grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-sand">La diferencia está en pedir</p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl">Administrar sin hacer todo manualmente.</h2>
            <p className="mt-5 max-w-xl leading-7 text-white/65">
              En lugar de entrar a múltiples formularios para cada cambio, ORQELIS AI convierte una instrucción en acciones concretas sobre el sistema.
            </p>
            <div className="mt-8 grid gap-3">
              {commands.map((command) => (
                <div key={command} className="flex gap-3 rounded-2xl bg-white/8 p-4">
                  <MessageSquareText className="mt-0.5 shrink-0 text-sand" size={19} />
                  <span className="text-sm text-white/85">“{command}”</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-7 text-ink shadow-2xl shadow-black/10 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-clay">Flujo ORQELIS</p>
            {[
              ["01", "Pedís", "Escribís lo que necesitás en lenguaje natural."],
              ["02", "La IA interpreta", "Identifica productos, cambios y datos necesarios."],
              ["03", "ORQELIS ejecuta", "Actualiza el sistema respetando permisos y validaciones."],
              ["04", "Tu tienda queda lista", "Los cambios se reflejan en la experiencia del cliente."],
            ].map(([n, t, d]) => (
              <div key={n} className="grid grid-cols-[42px_1fr] gap-4 border-b border-ink/10 py-5 last:border-0">
                <span className="font-display text-2xl text-clay">{n}</span>
                <div>
                  <p className="font-extrabold">{t}</p>
                  <p className="mt-1 text-sm text-ink/55">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-store py-20 sm:py-28">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([Icon, title, text]) => (
            <div key={title} className="rounded-2xl bg-cream p-6">
              <Icon className="text-clay" />
              <p className="mt-4 font-extrabold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-store pb-12 sm:pb-16">
        <div className="grid overflow-hidden rounded-[2rem] border border-ink/10 bg-white lg:grid-cols-[.78fr_1.22fr]">
          <div className="bg-sand/45 p-8 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[.18em] text-clay">Demo real</p>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">No te contamos solamente cómo sería.</h2>
            <p className="mt-4 text-sm leading-7 text-ink/60">
              La demo pública permite recorrer una tienda funcional creada sobre el mismo sistema y ver cómo se presenta el catálogo al cliente final.
            </p>
            <Link href="/demo" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-extrabold text-white">
              Abrir tienda demo <ArrowRight size={17} />
            </Link>
          </div>
          <div className="p-6 sm:p-8">
            <div className="rounded-[1.5rem] border border-ink/10 bg-[#f8f6f2] p-5">
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="text-[.62rem] font-black uppercase tracking-[.16em] text-clay">ORQELIS Admin</p>
                  <p className="mt-1 font-extrabold">Vista general</p>
                </div>
                <LayoutDashboard className="text-clay" size={22} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Productos", "Categorías", "Configuración", "Visibilidad"].map((item, index) => (
                  <div key={item} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-ink/42">Módulo {String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-1 font-extrabold">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="container-store pb-24">
        <div className="overflow-hidden rounded-[2.25rem] bg-clay px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-sand">ORQELIS para comercios</p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl leading-[1.03] sm:text-5xl">Menos tiempo administrando. Más tiempo vendiendo.</h2>
            <p className="mt-4 max-w-2xl text-white/75">
              ORQELIS está pensado para adaptarse a distintos negocios con su propia identidad, catálogo y configuración.
            </p>
          </div>
          <div className="mt-8 flex shrink-0 flex-wrap gap-3 lg:mt-0">
            <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-ink">
              Probar la demo <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
