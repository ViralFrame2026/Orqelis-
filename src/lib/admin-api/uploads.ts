import { AdminApiError } from "@/lib/admin-api/errors";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export function safeImageName(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "imagen";
}

function matchesMagicBytes(mime: string, bytes: Uint8Array) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (mime === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export function validateImageMetadata(input: {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}) {
  const extensions = MIME_TO_EXTENSIONS[input.type];
  if (!extensions) {
    throw new AdminApiError(415, "INVALID_FILE_TYPE", "Solo se aceptan imágenes JPG, JPEG, PNG o WEBP.");
  }
  if (input.size < 1 || input.size > MAX_IMAGE_SIZE) {
    throw new AdminApiError(413, "INVALID_FILE_SIZE", "Cada imagen debe pesar entre 1 byte y 10 MB.");
  }
  const extension = input.name.split(".").at(-1)?.toLowerCase() ?? "";
  if (!extensions.includes(extension)) {
    throw new AdminApiError(415, "INVALID_FILE_EXTENSION", "La extensión no coincide con el formato permitido.");
  }
  if (!matchesMagicBytes(input.type, input.bytes)) {
    throw new AdminApiError(415, "INVALID_FILE_CONTENT", "El contenido del archivo no coincide con una imagen válida.");
  }
  return { extension, safeName: safeImageName(input.name) };
}

export async function validateImageFile(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return validateImageMetadata({ name: file.name, type: file.type, size: file.size, bytes });
}

