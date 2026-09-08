import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminActivity, type AuditSource } from "@/lib/admin-api/audit";
import { AdminApiError } from "@/lib/admin-api/errors";
import { validateImageFile } from "@/lib/admin-api/uploads";

const BUCKET = "product-images";

export async function uploadAdminImages(
  client: SupabaseClient,
  files: File[],
  source: AuditSource,
) {
  if (!files.length) throw new AdminApiError(422, "VALIDATION_ERROR", "Debe adjuntar al menos una imagen.");
  if (files.length > 10) throw new AdminApiError(422, "TOO_MANY_FILES", "Se aceptan hasta 10 imágenes por solicitud.");

  const validated = await Promise.all(files.map(async (file) => ({ file, metadata: await validateImageFile(file) })));
  const uploaded: { url: string; storage_path: string; original_name: string; size: number; mime_type: string }[] = [];

  try {
    for (const { file, metadata } of validated) {
      const month = new Date().toISOString().slice(0, 7);
      const storagePath = `api/${month}/${crypto.randomUUID()}-${metadata.safeName}.${metadata.extension}`;
      const { error } = await client.storage.from(BUCKET).upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
      if (error) throw new AdminApiError(503, "UPLOAD_FAILED", `No se pudo subir ${file.name}.`);
      const { data } = client.storage.from(BUCKET).getPublicUrl(storagePath);
      uploaded.push({
        url: data.publicUrl,
        storage_path: storagePath,
        original_name: file.name,
        size: file.size,
        mime_type: file.type,
      });
    }
  } catch (error) {
    if (uploaded.length) await client.storage.from(BUCKET).remove(uploaded.map((item) => item.storage_path));
    throw error;
  }

  await logAdminActivity(client, {
    action: "images_uploaded",
    entityType: "upload",
    source,
    summary: { count: uploaded.length, formats: [...new Set(uploaded.map((item) => item.mime_type))] },
  });
  return uploaded;
}

