import { requireAdminApi } from "@/lib/admin-api/guard";
import { runIdempotent } from "@/lib/admin-api/idempotency";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { createProductSchema, productFiltersSchema } from "@/lib/admin-api/schemas";
import { createAdminProduct, listAdminProducts } from "@/services/admin-products";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdminApi(request, { scope: "products-read" });
    const url = new URL(request.url);
    const filters = productFiltersSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await listAdminProducts(client, filters);
    return successResponse(result.products, {
      meta: { total: result.total, limit: result.limit, offset: result.offset },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "products-write", limit: 60 });
    const raw = await readJsonBody(request);
    const input = createProductSchema.parse(raw);
    const { result, replayed } = await runIdempotent(
      client,
      request.headers.get("idempotency-key"),
      "POST:/api/v1/admin/products",
      raw,
      async () => {
        const created = await createAdminProduct(client, input, source);
        return { data: created.product, warnings: created.warnings, status: 201 };
      },
    );
    return successResponse(result.data, {
      status: result.status,
      warnings: result.warnings,
      meta: result.meta,
      headers: { "X-Idempotent-Replayed": String(replayed) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

