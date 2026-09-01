import "server-only";

import { createHash } from "node:crypto";
import { AdminApiError } from "@/lib/admin-api/errors";
import type { CreateProductInput } from "@/lib/admin-api/schemas";
import { MAX_IMAGE_SIZE, validateImageMetadata } from "@/lib/admin-api/uploads";

const MAX_SHEET_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 20_000;

const HEADER_ALIASES: Record<keyof CatalogColumns, string[]> = {
  name: ["nombre", "name", "producto"],
  slug: ["slug"],
  sku: ["sku", "codigo", "codigo_producto"],
  category: ["categoria", "category"],
  short_description: ["descripcion_corta", "short_description", "resumen"],
  description: ["descripcion", "description", "descripcion_completa"],
  price: ["precio", "price"],
  previous_price: ["precio_anterior", "previous_price"],
  installments: ["cuotas", "installments"],
  installment_price: ["precio_cuota", "installment_price", "valor_cuota"],
  stock: ["stock"],
  status: ["estado", "status"],
  featured: ["destacado", "featured"],
  offer: ["oferta", "offer"],
  is_new: ["nuevo", "is_new"],
  tags: ["etiquetas", "tags"],
  features: ["caracteristicas", "features"],
  drive_images: ["imagenes_drive", "fotos_drive", "drive_images", "imagenes", "fotos"],
};

const REQUIRED_COLUMNS: (keyof CatalogColumns)[] = [
  "name",
  "category",
  "short_description",
  "description",
  "price",
  "status",
];

type CatalogColumns = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  short_description: string;
  description: string;
  price: string;
  previous_price: string;
  installments: string;
  installment_price: string;
  stock: string;
  status: string;
  featured: string;
  offer: string;
  is_new: string;
  tags: string;
  features: string;
  drive_images: string;
};

export type CatalogSheetRow = {
  rowNumber: number;
  values: Partial<CatalogColumns>;
};

export type LoadedCatalogSheet = {
  spreadsheetId: string;
  gid: string;
  sheetHash: string;
  rows: CatalogSheetRow[];
};

function normalizedHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isAllowedGoogleHost(hostname: string, kind: "sheet" | "image") {
  const host = hostname.toLowerCase();
  const googleContent = host === "googleusercontent.com" || host.endsWith(".googleusercontent.com");
  if (googleContent) return true;
  if (kind === "sheet") return host === "docs.google.com";
  return host === "drive.google.com" || host === "drive.usercontent.google.com";
}

async function fetchGoogleResource(url: URL, kind: "sheet" | "image") {
  let current = url;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    if (current.protocol !== "https:" || !isAllowedGoogleHost(current.hostname, kind)) {
      throw new AdminApiError(422, "UNTRUSTED_GOOGLE_URL", "El enlace no pertenece a un recurso permitido de Google.");
    }

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": "ORQELIS-Catalog-Importer/1.0" },
      });
    } catch {
      throw new AdminApiError(502, "GOOGLE_FETCH_FAILED", "No se pudo descargar el recurso desde Google Drive.");
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new AdminApiError(502, "INVALID_GOOGLE_REDIRECT", "Google devolvió una redirección inválida.");
      await response.body?.cancel();
      current = new URL(location, current);
      continue;
    }
    return response;
  }
  throw new AdminApiError(502, "TOO_MANY_REDIRECTS", "Google devolvió demasiadas redirecciones.");
}

async function readBoundedBody(response: Response, maxBytes: number, errorCode: string) {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) {
    throw new AdminApiError(413, errorCode, "El archivo supera el tamaño permitido.");
  }
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new AdminApiError(413, errorCode, "El archivo supera el tamaño permitido.");
    }
    chunks.push(value);
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export function parseGoogleSheetUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AdminApiError(422, "INVALID_SHEET_URL", "El enlace de Google Sheets no es válido.");
  }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "docs.google.com") {
    throw new AdminApiError(422, "INVALID_SHEET_URL", "Debe usar un enlace https de Google Sheets.");
  }
  const match = /^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(url.pathname);
  if (!match) throw new AdminApiError(422, "INVALID_SHEET_URL", "No se pudo identificar la planilla de Google Sheets.");
  const hashGid = /(?:^|[&#])gid=(\d+)/.exec(url.hash)?.[1];
  const gid = url.searchParams.get("gid")?.match(/^\d+$/)?.[0] ?? hashGid ?? "0";
  return { spreadsheetId: match[1], gid };
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }

  if (quoted) throw new AdminApiError(422, "INVALID_CSV", "La planilla contiene una celda con comillas sin cerrar.");
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function mapHeaders(headers: string[]) {
  const normalized = headers.map(normalizedHeader);
  const indexes = new Map<keyof CatalogColumns, number>();
  for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [keyof CatalogColumns, string[]][]) {
    const index = normalized.findIndex((header) => aliases.includes(header));
    if (index >= 0) indexes.set(column, index);
  }
  const missing = REQUIRED_COLUMNS.filter((column) => !indexes.has(column));
  if (missing.length) {
    throw new AdminApiError(422, "MISSING_COLUMNS", "Faltan columnas obligatorias en la planilla.", [
      { columns: missing.map((column) => HEADER_ALIASES[column][0]) },
    ]);
  }
  return indexes;
}

export function parseCatalogSheetText(text: string) {
  const csvRows = parseCsv(text);
  if (!csvRows.length) throw new AdminApiError(422, "EMPTY_SHEET", "La planilla está vacía.");
  const indexes = mapHeaders(csvRows[0]);
  const rows = csvRows.slice(1).flatMap((cells, index) => {
    const values: Partial<CatalogColumns> = {};
    for (const [column, cellIndex] of indexes) values[column] = cells[cellIndex]?.trim() ?? "";
    if (!Object.values(values).some(Boolean)) return [];
    return [{ rowNumber: index + 2, values }];
  });
  if (rows.length > 100) {
    throw new AdminApiError(422, "TOO_MANY_ROWS", "Se pueden revisar hasta 100 productos por planilla.");
  }
  return rows;
}

export async function loadGoogleCatalogSheet(sheetUrl: string): Promise<LoadedCatalogSheet> {
  const { spreadsheetId, gid } = parseGoogleSheetUrl(sheetUrl);
  const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export`);
  exportUrl.searchParams.set("format", "csv");
  exportUrl.searchParams.set("gid", gid);
  const response = await fetchGoogleResource(exportUrl, "sheet");
  if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
    throw new AdminApiError(
      response.status === 401 || response.status === 403 ? 422 : 502,
      "SHEET_NOT_PUBLIC",
      "No se pudo leer la planilla. Compartila como 'Cualquier persona con el enlace: Lector'.",
    );
  }
  const bytes = await readBoundedBody(response, MAX_SHEET_BYTES, "SHEET_TOO_LARGE");
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return {
    spreadsheetId,
    gid,
    sheetHash: createHash("sha256").update(bytes).digest("hex"),
    rows: parseCatalogSheetText(text),
  };
}

function splitList(value = "") {
  return value.split(/[|\n]/).map((item) => item.trim()).filter(Boolean);
}

function optionalValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function mapCatalogRow(row: CatalogSheetRow): { candidate: unknown; driveImageUrls: string[] } {
  const values = row.values;
  const candidate: Record<string, unknown> = {
    name: values.name ?? "",
    category: values.category ?? "",
    short_description: values.short_description ?? "",
    description: values.description ?? "",
    price: values.price ?? "",
    status: values.status ?? "",
    images: [],
  };
  const optionalFields: (keyof CreateProductInput)[] = [
    "slug", "sku", "previous_price", "installments", "installment_price", "stock",
    "featured", "offer", "is_new",
  ];
  for (const field of optionalFields) {
    const value = optionalValue(values[field as keyof CatalogColumns]);
    if (value !== undefined) candidate[field] = value;
  }
  candidate.tags = splitList(values.tags);
  candidate.features = splitList(values.features);
  return { candidate, driveImageUrls: splitList(values.drive_images) };
}

export function extractDriveFileId(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AdminApiError(422, "INVALID_DRIVE_IMAGE_URL", "Una imagen no tiene un enlace válido de Google Drive.");
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !["drive.google.com", "drive.usercontent.google.com"].includes(host)) {
    throw new AdminApiError(422, "INVALID_DRIVE_IMAGE_URL", "Las imágenes deben usar enlaces de archivos de Google Drive.");
  }
  if (/\/folders\//.test(url.pathname)) {
    throw new AdminApiError(422, "DRIVE_FOLDER_NOT_IMAGE", "Se recibió un enlace a una carpeta; cada celda necesita enlaces a archivos de imagen.");
  }
  const pathId = /\/file\/d\/([A-Za-z0-9_-]{10,})/.exec(url.pathname)?.[1];
  const queryId = url.searchParams.get("id")?.match(/^[A-Za-z0-9_-]{10,}$/)?.[0];
  const fileId = pathId ?? queryId;
  if (!fileId) throw new AdminApiError(422, "INVALID_DRIVE_IMAGE_URL", "No se pudo identificar el archivo de imagen de Google Drive.");
  return fileId;
}

function detectImageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) {
    return { mime: "image/png", extension: "png" };
  }
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }
  throw new AdminApiError(415, "INVALID_FILE_CONTENT", "El archivo de Drive no contiene una imagen JPG, PNG o WEBP válida.");
}

export async function downloadDriveImage(driveUrl: string, position = 0) {
  const fileId = extractDriveFileId(driveUrl);
  const directUrl = new URL("https://drive.usercontent.google.com/download");
  directUrl.searchParams.set("id", fileId);
  directUrl.searchParams.set("export", "download");
  directUrl.searchParams.set("confirm", "t");
  const response = await fetchGoogleResource(directUrl, "image");
  if (!response.ok) {
    throw new AdminApiError(
      response.status === 401 || response.status === 403 ? 422 : 502,
      "DRIVE_IMAGE_NOT_PUBLIC",
      "No se pudo descargar una imagen. Compartí la carpeta como 'Cualquier persona con el enlace: Lector'.",
      [{ drive_url: driveUrl, status: response.status }],
    );
  }
  const bytes = await readBoundedBody(response, MAX_IMAGE_SIZE, "INVALID_FILE_SIZE");
  const detected = detectImageType(bytes);
  const name = `drive-${fileId.slice(0, 18)}-${position + 1}.${detected.extension}`;
  validateImageMetadata({ name, type: detected.mime, size: bytes.byteLength, bytes: bytes.slice(0, 16) });
  return new File([bytes], name, { type: detected.mime });
}
