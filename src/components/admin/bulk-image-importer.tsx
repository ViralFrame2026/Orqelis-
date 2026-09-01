"use client";

import type JSZip from "jszip";
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  ImageUp,
  LoaderCircle,
  RefreshCw,
  SearchCheck,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  discardBulkImageUploadAction,
  finalizeBulkImageUploadAction,
  prepareBulkImageUploadAction,
  previewBulkImageImportAction,
} from "@/app/admin/(panel)/productos/importar-imagenes/actions";
import {
  basenameFromZipEntry,
  imageMimeFromFilename,
  isAllowedImageFilename,
  MAX_IMPORT_IMAGES,
  MAX_ZIP_ENTRIES,
  MAX_ZIP_SIZE,
  PRODUCT_IMAGES_BUCKET,
  type BulkImagePreviewItem,
} from "@/lib/admin-api/bulk-image-import";
import { MAX_IMAGE_SIZE, validateImageMetadata } from "@/lib/admin-api/uploads";
import { createClient } from "@/lib/supabase/client";

type ZipEntryWithSize = JSZip.JSZipObject & {
  _data?: { uncompressedSize?: number };
};

type LoadedImage = {
  entry: JSZip.JSZipObject;
  filename: string;
  declaredSize?: number;
};

type ImportOutcome = {
  filename: string;
  productName?: string;
  status: "success" | "error" | "warning";
  message: string;
};

type ProgressState = {
  total: number;
  processed: number;
  correct: number;
  errors: number;
};

const EMPTY_PROGRESS: ProgressState = { total: 0, processed: 0, correct: 0, errors: 0 };

function isSystemEntry(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const basename = basenameFromZipEntry(normalized);
  return normalized.startsWith("__MACOSX/") || basename === ".DS_Store" || basename.startsWith("._");
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Ocurrió un error inesperado.";
}

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toLocaleString("es-AR", { maximumFractionDigits: 1 })} MB`;
}

export function BulkImageImporter() {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedImagesRef = useRef<LoadedImage[]>([]);
  const [zipName, setZipName] = useState("");
  const [preview, setPreview] = useState<BulkImagePreviewItem[]>([]);
  const [unsupported, setUnsupported] = useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [outcomes, setOutcomes] = useState<ImportOutcome[]>([]);
  const [completed, setCompleted] = useState(false);

  const matched = preview.filter((item) => item.status === "matched");
  const unmatched = preview.filter((item) => item.status === "unmatched");
  const invalid = preview.filter((item) => item.status === "invalid" || item.status === "duplicate");
  const percentage = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;

  function reset() {
    loadedImagesRef.current = [];
    setZipName("");
    setPreview([]);
    setUnsupported([]);
    setPageError("");
    setProgress(EMPTY_PROGRESS);
    setOutcomes([]);
    setCompleted(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function loadZip(file: File) {
    reset();
    setLoadingPreview(true);
    setZipName(file.name);

    try {
      if (!file.name.toLowerCase().endsWith(".zip")) throw new Error("Seleccioná un archivo con extensión .zip.");
      if (file.size < 1 || file.size > MAX_ZIP_SIZE) {
        throw new Error("El ZIP debe pesar entre 1 byte y 1 GB.");
      }

      const { default: JSZipRuntime } = await import("jszip");
      const zip = await JSZipRuntime.loadAsync(file, { createFolders: false });
      const entries = Object.values(zip.files).filter((entry) => !entry.dir && !isSystemEntry(entry.unsafeOriginalName ?? entry.name));
      if (entries.length > MAX_ZIP_ENTRIES) {
        throw new Error(`El ZIP supera el máximo de ${MAX_ZIP_ENTRIES} archivos.`);
      }

      const unsupportedNames: string[] = [];
      const images: LoadedImage[] = [];
      for (const entry of entries) {
        const originalPath = entry.unsafeOriginalName ?? entry.name;
        const filename = basenameFromZipEntry(originalPath);
        if (!isAllowedImageFilename(filename)) {
          unsupportedNames.push(filename || originalPath);
          continue;
        }
        images.push({
          entry,
          filename,
          declaredSize: (entry as ZipEntryWithSize)._data?.uncompressedSize,
        });
      }

      if (!images.length) throw new Error("No se encontraron imágenes JPG, PNG o WebP dentro del ZIP.");
      if (images.length > MAX_IMPORT_IMAGES) {
        throw new Error(`El ZIP contiene más de ${MAX_IMPORT_IMAGES} imágenes.`);
      }

      const response = await previewBulkImageImportAction(images.map(({ filename }) => filename));
      if (!response.ok) throw new Error(response.error);
      const previewItems = response.data.map((item, index) => {
        const size = images[index]?.declaredSize;
        if (typeof size === "number" && (size < 1 || size > MAX_IMAGE_SIZE)) {
          return {
            ...item,
            status: "invalid" as const,
            message: `La imagen pesa ${formatMegabytes(size)}; el máximo es 10 MB.`,
          };
        }
        return item;
      });

      loadedImagesRef.current = images;
      setPreview(previewItems);
      setUnsupported(unsupportedNames);
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setLoadingPreview(false);
    }
  }

  async function processImage(item: BulkImagePreviewItem, index: number): Promise<ImportOutcome> {
    const loaded = loadedImagesRef.current[index];
    if (!loaded || item.status !== "matched") {
      return { filename: item.filename, status: "error", message: "No se pudo recuperar el archivo del ZIP." };
    }

    let preparedPath = "";
    try {
      const mime = imageMimeFromFilename(item.filename);
      if (!mime) throw new Error("Formato de imagen no permitido.");
      const arrayBuffer = await loaded.entry.async("arraybuffer");
      const imageFile = new File([arrayBuffer], item.filename, { type: mime });
      const bytes = new Uint8Array(arrayBuffer.slice(0, 16));
      validateImageMetadata({ name: imageFile.name, type: imageFile.type, size: imageFile.size, bytes });

      const prepared = await prepareBulkImageUploadAction({
        filename: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
      });
      if (!prepared.ok) throw new Error(prepared.error);
      preparedPath = prepared.data.path;

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .uploadToSignedUrl(prepared.data.path, prepared.data.token, imageFile, {
          cacheControl: "31536000",
          contentType: imageFile.type,
          upsert: false,
        });
      if (uploadError) throw new Error(`Storage rechazó la imagen: ${uploadError.message}`);

      const finalized = await finalizeBulkImageUploadAction({
        filename: imageFile.name,
        path: prepared.data.path,
      });
      if (!finalized.ok) throw new Error(finalized.error);
      if (finalized.data.warning) {
        return {
          filename: item.filename,
          productName: finalized.data.productName,
          status: "warning",
          message: finalized.data.warning,
        };
      }
      return {
        filename: item.filename,
        productName: finalized.data.productName,
        status: "success",
        message: "Imagen reemplazada correctamente.",
      };
    } catch (error) {
      if (preparedPath) await discardBulkImageUploadAction(preparedPath);
      return {
        filename: item.filename,
        productName: item.productName,
        status: "error",
        message: errorMessage(error),
      };
    }
  }

  async function runImport() {
    const queue = preview
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status === "matched");
    if (!queue.length || importing) return;

    setImporting(true);
    setCompleted(false);
    setOutcomes([]);
    setPageError("");
    setProgress({ total: queue.length, processed: 0, correct: 0, errors: 0 });

    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < queue.length) {
        const current = queue[nextIndex++];
        const outcome = await processImage(current.item, current.index);
        setOutcomes((currentOutcomes) => [...currentOutcomes, outcome]);
        setProgress((currentProgress) => ({
          ...currentProgress,
          processed: currentProgress.processed + 1,
          correct: currentProgress.correct + (outcome.status === "error" ? 0 : 1),
          errors: currentProgress.errors + (outcome.status === "error" ? 1 : 0),
        }));
      }
    };

    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, () => worker()));
    setImporting(false);
    setCompleted(true);
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[1.4rem] border border-ink/8 bg-white p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-clay/10 text-clay">
            <FileArchive size={22} />
          </div>
          <div>
            <h2 className="font-display text-2xl">Seleccioná el ZIP</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/52">
              Se aceptan JPG, PNG y WebP de hasta 10 MB cada una. La imagen se copia sin recomprimir para conservar su calidad original.
            </p>
          </div>
        </div>

        <label className={`focus-within:ring-clay/35 mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition focus-within:ring-4 ${loadingPreview || importing ? "cursor-not-allowed border-ink/8 bg-ink/[.02] opacity-60" : "border-clay/25 bg-[#fffaf5] hover:border-clay/50"}`}>
          {loadingPreview ? <LoaderCircle className="animate-spin text-clay" size={30} /> : <ImageUp className="text-clay" size={30} />}
          <span className="mt-3 text-sm font-black">{loadingPreview ? "Leyendo y comparando archivos…" : "Tocá para elegir el archivo ZIP"}</span>
          <span className="mt-1 text-xs text-ink/42">El ZIP se abre en tu dispositivo; no se guarda como Base64.</span>
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="sr-only"
            disabled={loadingPreview || importing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadZip(file);
            }}
          />
        </label>

        {zipName ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink/[.035] px-4 py-3">
            <p className="min-w-0 truncate text-sm font-bold"><span className="text-ink/42">Archivo:</span> {zipName}</p>
            {!importing && !loadingPreview ? (
              <button type="button" onClick={reset} className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-black text-clay">
                <RefreshCw size={14} /> Elegir otro
              </button>
            ) : null}
          </div>
        ) : null}

        {pageError ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={17} /> {pageError}
          </p>
        ) : null}
      </section>

      {preview.length ? (
        <section className="rounded-[1.4rem] border border-ink/8 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <SearchCheck className="text-clay" size={24} />
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-clay">Vista previa</p>
              <h2 className="font-display mt-1 text-2xl">Revisá antes de reemplazar</h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Imágenes detectadas" value={preview.length} />
            <Stat label="Coincidencias" value={matched.length} tone="success" />
            <Stat label="Sin producto" value={unmatched.length} tone={unmatched.length ? "warning" : "neutral"} />
            <Stat label="No procesables" value={invalid.length + unsupported.length} tone={invalid.length + unsupported.length ? "danger" : "neutral"} />
          </div>

          {matched.length ? (
            <div className="mt-6 max-h-72 overflow-auto rounded-xl border border-ink/8">
              {matched.map((item) => (
                <div key={item.key} className="grid gap-1 border-b border-ink/6 px-4 py-3 last:border-0 sm:grid-cols-[1fr_1.3fr] sm:gap-5">
                  <p className="truncate text-xs font-bold text-ink/55">{item.filename}</p>
                  <p className="truncate text-sm font-extrabold">{item.productName}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Ningún nombre de archivo coincide con la relación guardada. No se modificará ningún producto.
            </p>
          )}

          {invalid.length || unsupported.length ? (
            <details className="mt-4 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
              <summary className="cursor-pointer text-sm font-black text-red-800">Ver archivos no procesables ({invalid.length + unsupported.length})</summary>
              <ul className="mt-3 grid gap-2 text-xs text-red-800/80">
                {invalid.map((item, index) => <li key={`${item.key}-${index}`}>{item.filename}: {item.message}</li>)}
                {unsupported.map((filename, index) => <li key={`${filename}-${index}`}>{filename}: extensión no permitida.</li>)}
              </ul>
            </details>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink/8 pt-5">
            <p className="max-w-2xl text-xs leading-5 text-ink/48">
              Solo se reemplazará la imagen de cada coincidencia. Nombre, descripción, precio, stock, categoría, oferta, destacado y visibilidad permanecerán iguales.
            </p>
            <button
              type="button"
              disabled={!matched.length || importing || completed}
              onClick={() => void runImport()}
              className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {importing ? <LoaderCircle className="animate-spin" size={18} /> : <ImageUp size={18} />}
              {importing ? "Importando…" : `Reemplazar ${matched.length} ${matched.length === 1 ? "imagen" : "imágenes"}`}
            </button>
          </div>
        </section>
      ) : null}

      {(importing || completed) ? (
        <section className="rounded-[1.4rem] border border-ink/8 bg-white p-5 sm:p-7" aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-clay">Progreso</p>
              <h2 className="font-display mt-1 text-2xl">{completed ? "Importación terminada" : "Reemplazando imágenes"}</h2>
            </div>
            <span className="text-sm font-black">{percentage}%</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-ink/8">
            <div className="h-full rounded-full bg-clay transition-[width] duration-300" style={{ width: `${percentage}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Procesadas" value={progress.processed} />
            <Stat label="Correctas" value={progress.correct} tone="success" />
            <Stat label="Errores" value={progress.errors} tone={progress.errors ? "danger" : "neutral"} />
          </div>

          {completed && unmatched.length ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-black text-amber-950">Archivos que no encontraron producto ({unmatched.length})</h3>
              <ul className="mt-3 grid gap-1.5 text-xs text-amber-900/80 sm:grid-cols-2">
                {unmatched.map((item, index) => <li key={`${item.key}-${index}`}>{item.filename}</li>)}
              </ul>
            </div>
          ) : null}

          {completed && outcomes.some((outcome) => outcome.status !== "success") ? (
            <details className="mt-4 rounded-xl border border-ink/8 px-4 py-3" open>
              <summary className="cursor-pointer text-sm font-black">Ver advertencias y errores</summary>
              <ul className="mt-3 grid gap-2 text-xs">
                {outcomes.filter((outcome) => outcome.status !== "success").map((outcome, index) => (
                  <li key={`${outcome.filename}-${index}`} className={outcome.status === "error" ? "text-red-700" : "text-amber-800"}>
                    <span className="font-black">{outcome.filename}</span>{outcome.productName ? ` · ${outcome.productName}` : ""}: {outcome.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {completed && progress.errors === 0 ? (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">
              <CheckCircle2 size={18} /> Las {progress.correct} imágenes coincidentes quedaron actualizadas.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneClass = {
    neutral: "bg-[#f7f5f1] text-ink",
    success: "bg-green-50 text-green-800",
    warning: "bg-amber-50 text-amber-900",
    danger: "bg-red-50 text-red-800",
  }[tone];
  return (
    <div className={`rounded-xl p-4 ${toneClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[.67rem] font-black uppercase tracking-wider opacity-60">{label}</p>
    </div>
  );
}
