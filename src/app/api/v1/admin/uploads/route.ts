import { requireAdminApi } from "@/lib/admin-api/guard";
import { AdminApiError } from "@/lib/admin-api/errors";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { uploadAdminImages } from "@/services/admin-uploads";

export async function POST(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "uploads", limit: 30 });
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      throw new AdminApiError(415, "INVALID_CONTENT_TYPE", "La carga debe usar multipart/form-data.");
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 105 * 1024 * 1024) {
      throw new AdminApiError(413, "PAYLOAD_TOO_LARGE", "La carga completa supera el tamaño permitido.");
    }
    const formData = await request.formData();
    const files = [...formData.getAll("files"), ...formData.getAll("file")].filter(
      (value): value is File => value instanceof File && value.size > 0,
    );
    return successResponse(await uploadAdminImages(client, files, source), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
