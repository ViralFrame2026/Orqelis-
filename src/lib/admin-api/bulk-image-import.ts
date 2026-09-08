import { MAX_IMAGE_SIZE, safeImageName } from "@/lib/admin-api/uploads";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_ZIP_SIZE = 1024 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 1000;
export const MAX_IMPORT_IMAGES = 500;

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type ImageFilenameMapping = {
  productId: string;
  productName: string;
  imageFilename: string;
};

export type BulkImagePreviewItem = {
  filename: string;
  key: string;
  status: "matched" | "unmatched" | "duplicate" | "invalid";
  productId?: string;
  productName?: string;
  message?: string;
};

export function basenameFromZipEntry(value: string) {
  return value.replace(/\\/g, "/").split("/").filter(Boolean).at(-1)?.trim() ?? "";
}

export function normalizeImageFilename(value: string) {
  return basenameFromZipEntry(value).normalize("NFKC").trim().toLocaleLowerCase("es");
}

export function imageExtension(filename: string) {
  return basenameFromZipEntry(filename).split(".").at(-1)?.toLowerCase() ?? "";
}

export function imageMimeFromFilename(filename: string) {
  return IMAGE_MIME_BY_EXTENSION[imageExtension(filename)] ?? null;
}

export function isAllowedImageFilename(filename: string) {
  const basename = basenameFromZipEntry(filename);
  return basename.length > 0 && basename.length <= 255 && imageMimeFromFilename(basename) !== null;
}

export function validateBulkImageDescriptor(input: { filename: string; type: string; size: number }) {
  const filename = basenameFromZipEntry(input.filename);
  const expectedType = imageMimeFromFilename(filename);
  if (!expectedType) throw new Error("Solo se aceptan imágenes JPG, JPEG, PNG o WebP.");
  if (input.size < 1 || input.size > MAX_IMAGE_SIZE) {
    throw new Error("Cada imagen debe pesar entre 1 byte y 10 MB.");
  }
  if (input.type !== expectedType) {
    throw new Error("La extensión no coincide con el formato de la imagen.");
  }
  return { filename, expectedType, extension: imageExtension(filename) };
}

export function matchBulkImageFilenames(
  filenames: string[],
  mappings: ImageFilenameMapping[],
): BulkImagePreviewItem[] {
  const keyCounts = new Map<string, number>();
  for (const filename of filenames) {
    const key = normalizeImageFilename(filename);
    if (key) keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  const mappingByKey = new Map(
    mappings.map((mapping) => [normalizeImageFilename(mapping.imageFilename), mapping]),
  );

  return filenames.map((rawFilename) => {
    const filename = basenameFromZipEntry(rawFilename);
    const key = normalizeImageFilename(filename);
    if (!isAllowedImageFilename(filename)) {
      return {
        filename: filename || rawFilename,
        key,
        status: "invalid",
        message: "Extensión no permitida o nombre de archivo inválido.",
      };
    }
    if ((keyCounts.get(key) ?? 0) > 1) {
      return {
        filename,
        key,
        status: "duplicate",
        message: "El ZIP contiene más de un archivo con este mismo nombre.",
      };
    }
    const mapping = mappingByKey.get(key);
    if (!mapping) return { filename, key, status: "unmatched" };
    return {
      filename,
      key,
      status: "matched",
      productId: mapping.productId,
      productName: mapping.productName,
    };
  });
}

export function buildBulkStoragePath(productId: string, filename: string, uploadId: string) {
  const extension = imageExtension(filename);
  return `${productId}/bulk/${uploadId}-${safeImageName(filename)}.${extension}`;
}

export function isSafeBulkStoragePath(productId: string, filename: string, path: string) {
  const extension = imageExtension(filename);
  const suffix = `-${safeImageName(filename)}.${extension}`;
  const prefix = `${productId}/bulk/`;
  const middle = path.startsWith(prefix) && path.endsWith(suffix)
    ? path.slice(prefix.length, -suffix.length)
    : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(middle);
}

export function isDiscardableBulkStoragePath(path: string) {
  return /^[0-9a-f-]{36}\/bulk\/[0-9a-f-]{36}-[a-z0-9-]+\.(?:jpe?g|png|webp)$/i.test(path);
}

