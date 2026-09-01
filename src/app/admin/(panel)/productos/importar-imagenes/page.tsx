import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BulkImageImporter } from "@/components/admin/bulk-image-importer";

export default function ImportProductImagesPage() {
  return (
    <div>
      <Link href="/admin/productos" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-ink/52 hover:text-ink">
        <ArrowLeft size={17} /> Volver a Productos
      </Link>
      <div className="mb-7 mt-4">
        <p className="text-xs font-black uppercase tracking-[.16em] text-clay">Catálogo</p>
        <h1 className="font-display mt-2 text-4xl">Importar imágenes</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/50">
          Reemplazá en lote las imágenes del catálogo usando el nombre original de cada archivo como clave.
        </p>
      </div>
      <BulkImageImporter />
    </div>
  );
}

