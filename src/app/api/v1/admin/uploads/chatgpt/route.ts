import { downloadChatGptImages, normalizeChatGptFileReferences } from "@/lib/admin-api/chatgpt-files";
import { AdminApiError } from "@/lib/admin-api/errors";
import { requireAdminApi } from "@/lib/admin-api/guard";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { uploadAdminImages } from "@/services/admin-uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "uploads-chatgpt", limit: 30 });
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      throw new AdminApiError(415, "INVALID_CONTENT_TYPE", "La carga desde ChatGPT debe usar application/json.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      throw new AdminApiError(400, "INVALID_JSON", "El cuerpo JSON no es válido.");
    }

    const references = normalizeChatGptFileReferences(body.openaiFileIdRefs);
    const files = await downloadChatGptImages(references);
    return successResponse(await uploadAdminImages(client, files, source), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
