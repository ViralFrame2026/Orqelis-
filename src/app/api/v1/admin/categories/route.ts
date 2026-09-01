import { requireAdminApi } from "@/lib/admin-api/guard";
import { runIdempotent } from "@/lib/admin-api/idempotency";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { categoryCreateSchema } from "@/lib/admin-api/schemas";
import { createAdminCategory, listAdminCategories } from "@/services/admin-categories";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdminApi(request, { scope: "categories-read" });
    return successResponse(await listAdminCategories(client));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "categories-write", limit: 60 });
    const raw = await readJsonBody(request);
    const input = categoryCreateSchema.parse(raw);
    const { result, replayed } = await runIdempotent(
      client,
      request.headers.get("idempotency-key"),
      "POST:/api/v1/admin/categories",
      raw,
      async () => ({ data: await createAdminCategory(client, input, source), status: 201 }),
    );
    return successResponse(result.data, {
      status: result.status,
      headers: { "X-Idempotent-Replayed": String(replayed) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

