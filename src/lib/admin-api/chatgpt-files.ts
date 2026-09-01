import { AdminApiError } from "@/lib/admin-api/errors";
import { MAX_IMAGE_SIZE, safeImageName, validateImageMetadata } from "@/lib/admin-api/uploads";

type ChatGptFileReference = {
  url: string;
  name?: string;
  mimeType?: string;
};

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function readOptionalString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeReference(value: unknown): ChatGptFileReference {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        return normalizeReference(JSON.parse(trimmed));
      } catch {
        throw new AdminApiError(422, "INVALID_FILE_REFERENCE", "ChatGPT envió una referencia de archivo inválida.");
      }
    }
    return { url: trimmed };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminApiError(422, "INVALID_FILE_REFERENCE", "ChatGPT envió una referencia de archivo inválida.");
  }

  const record = value as Record<string, unknown>;
  const url = readOptionalString(record, ["download_link", "download_url", "url"]);
  if (!url) {
    throw new AdminApiError(
      422,
      "FILE_DOWNLOAD_LINK_MISSING",
      "ChatGPT no entregó un enlace temporal para descargar la imagen. Volvé a adjuntarla en el mensaje.",
    );
  }
  return {
    url,
    name: readOptionalString(record, ["name", "filename", "file_name"]),
    mimeType: readOptionalString(record, ["mime_type", "mimeType", "content_type"]),
  };
}

export function normalizeChatGptFileReferences(input: unknown) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new AdminApiError(422, "FILE_REFERENCE_REQUIRED", "Adjuntá al menos una imagen en el mensaje de ChatGPT.");
  }
  if (input.length > 10) {
    throw new AdminApiError(422, "TOO_MANY_FILES", "Se aceptan hasta 10 imágenes adjuntas por solicitud.");
  }
  return input.map(normalizeReference);
}

export function isAllowedChatGptFileUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" &&
      (hostname === "oaiusercontent.com" || hostname.endsWith(".oaiusercontent.com"));
  } catch {
    return false;
  }
}

function contentDispositionName(value: string | null) {
  if (!value) return undefined;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      return encoded;
    }
  }
  return value.match(/filename="?([^";]+)"?/i)?.[1]?.trim();
}

async function readResponseBody(response: Response) {
  if (!response.body) throw new AdminApiError(502, "EMPTY_FILE", "ChatGPT entregó un archivo vacío.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_IMAGE_SIZE) {
      await reader.cancel();
      throw new AdminApiError(413, "INVALID_FILE_SIZE", "Cada imagen debe pesar como máximo 10 MB.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function imageFileName(reference: ChatGptFileReference, response: Response, mimeType: string, index: number) {
  const headerName = contentDispositionName(response.headers.get("content-disposition"));
  let urlName: string | undefined;
  try {
    urlName = decodeURIComponent(new URL(reference.url).pathname.split("/").at(-1) ?? "");
  } catch {
    urlName = undefined;
  }
  const candidate = reference.name || headerName || urlName || `imagen-chatgpt-${index + 1}`;
  return `${safeImageName(candidate)}.${MIME_EXTENSIONS[mimeType]}`;
}

export async function downloadChatGptImages(references: ChatGptFileReference[]) {
  const files: File[] = [];

  for (const [index, reference] of references.entries()) {
    if (!isAllowedChatGptFileUrl(reference.url)) {
      throw new AdminApiError(
        422,
        "UNTRUSTED_FILE_HOST",
        "La referencia adjunta no pertenece al alojamiento seguro de archivos de ChatGPT.",
      );
    }

    let response: Response;
    try {
      response = await fetch(reference.url, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
        headers: { Accept: "image/jpeg,image/png,image/webp" },
      });
    } catch {
      throw new AdminApiError(
        502,
        "FILE_DOWNLOAD_FAILED",
        "No se pudo descargar la imagen adjunta desde ChatGPT. Volvé a adjuntarla e intentá nuevamente.",
      );
    }

    if (!response.ok) {
      throw new AdminApiError(
        502,
        "FILE_DOWNLOAD_FAILED",
        "El enlace temporal de la imagen venció o no está disponible. Volvé a adjuntarla.",
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_SIZE) {
      throw new AdminApiError(413, "INVALID_FILE_SIZE", "Cada imagen debe pesar como máximo 10 MB.");
    }

    const responseMime = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    const referenceMime = reference.mimeType?.split(";")[0]?.trim().toLowerCase();
    const mimeType = responseMime && responseMime !== "application/octet-stream" ? responseMime : referenceMime;
    if (!mimeType || !MIME_EXTENSIONS[mimeType]) {
      throw new AdminApiError(415, "INVALID_FILE_TYPE", "Solo se aceptan imágenes JPG, JPEG, PNG o WEBP.");
    }

    const bytes = await readResponseBody(response);
    const name = imageFileName(reference, response, mimeType, index);
    validateImageMetadata({ name, type: mimeType, size: bytes.byteLength, bytes: bytes.slice(0, 16) });
    files.push(new File([bytes], name, { type: mimeType }));
  }

  return files;
}
