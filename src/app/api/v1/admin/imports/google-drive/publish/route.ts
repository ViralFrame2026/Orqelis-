import { AdminApiError } from "@/lib/admin-api/errors";
import { requireAdminApi } from "@/lib/admin-api/guard";
import { runIdempotent } from "@/lib/admin-api/idempotency";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { googleDriveImportPublishSchema } from "@/lib/admin-api/schemas";
import { publishGoogleDriveCatalog } from "@/services/admin-google-drive-import";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "drive-import-publish", limit: 10 });
    const raw = await readJsonBody(request);
    const input = googleDriveImportPublishSchema.parse(raw);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey) {
      throw new AdminApiError(
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
        "La publicación requiere el encabezado Idempotency-Key.",
      );
    }
    const { result, replayed } = await runIdempotent(
      client,
      idempotencyKey,
      "POST:/api/v1/admin/imports/google-drive/publish",
      input,
      async () => {
        const data = await publishGoogleDriveCatalog(
          client,
          {
            sheetUrl: input.sheet_url,
            expectedSheetHash: input.expected_sheet_hash,
            rowNumbers: input.row_numbers,
          },
          source,
        );
        return { data, status: data.failed ? 207 : 201 };
      },
    );
    return successResponse(result.data, {
      status: result.status,
      headers: { "X-Idempotent-Replayed": String(replayed) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
