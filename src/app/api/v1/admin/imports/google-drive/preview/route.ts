import { requireAdminApi } from "@/lib/admin-api/guard";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { googleDriveImportPreviewSchema } from "@/lib/admin-api/schemas";
import { previewGoogleDriveCatalog } from "@/services/admin-google-drive-import";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { client } = await requireAdminApi(request, { scope: "drive-import-preview", limit: 30 });
    const input = googleDriveImportPreviewSchema.parse(await readJsonBody(request));
    return successResponse(await previewGoogleDriveCatalog(client, input.sheet_url));
  } catch (error) {
    return errorResponse(error);
  }
}
