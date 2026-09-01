import { requireAdminApi } from "@/lib/admin-api/guard";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { createProductSchema } from "@/lib/admin-api/schemas";
import { previewAdminProduct } from "@/services/admin-products";

export async function POST(request: Request) {
  try {
    const { client } = await requireAdminApi(request, { scope: "products-read" });
    const input = createProductSchema.parse(await readJsonBody(request));
    const preview = await previewAdminProduct(client, input);
    return successResponse(preview.product, {
      warnings: preview.warnings,
      meta: { can_create: preview.can_create },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

