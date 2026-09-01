import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad de la asistente | ORQELIS",
  description: "Política de privacidad para la conexión de la asistente ORQELIS con ChatGPT.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-xs font-black uppercase tracking-[.16em] text-clay">ORQELIS</p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">Privacidad de la asistente</h1>
      <p className="mt-5 text-sm font-semibold leading-7 text-ink/60">Última actualización: 21 de agosto de 2026.</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-ink/68">
        <section>
          <h2 className="font-display text-2xl text-ink">Qué hace la conexión</h2>
          <p className="mt-2">La asistente de ORQELIS permite consultar y administrar el catálogo mediante instrucciones dadas por una persona autorizada en ChatGPT.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Datos utilizados</h2>
          <p className="mt-2">La conexión procesa únicamente la información necesaria para la operación solicitada: productos, categorías, precios, descripciones, stock, estados, etiquetas, características e imágenes indicadas por el usuario.</p>
          <p className="mt-2">Cuando el usuario pide utilizar una imagen adjunta, ChatGPT entrega a ORQELIS una referencia temporal de descarga. ORQELIS valida el archivo y lo conserva en su almacenamiento solamente después de la confirmación de la operación.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Seguridad y auditoría</h2>
          <p className="mt-2">Las solicitudes requieren una credencial privada de servidor. ORQELIS registra la acción, la entidad modificada, el origen y un resumen sin guardar claves, contraseñas ni tokens.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Conservación y terceros</h2>
          <p className="mt-2">Los datos del catálogo se conservan en la infraestructura de ORQELIS. Los productos archivados se mantienen para evitar pérdidas accidentales. ORQELIS no vende los datos del catálogo ni los comparte con fines publicitarios.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Contacto</h2>
          <p className="mt-2">Para consultas sobre esta conexión, utilizá los canales publicados en la página de contacto de ORQELIS.</p>
          <Link href="/contacto" className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 font-extrabold text-white">Ir a contacto</Link>
        </section>
      </div>
    </main>
  );
}
