import { asAdminApiError } from "@/lib/admin-api/errors";
import { requireAdminApi } from "@/lib/admin-api/guard";
import { runIdempotent } from "@/lib/admin-api/idempotency";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import {
  bulkCreateSchema,
  bulkUpdateSchema,
  createProductSchema,
  patchProductSchema,
} from "@/lib/admin-api/schemas";
import { createAdminProduct, updateAdminProduct } from "@/services/admin-products";

export async function POST(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "products-bulk", limit: 20 });
    const raw = await readJsonBody(request, 5_000_000);
    const { products } = bulkCreateSchema.parse(raw);
    const { result, replayed } = await runIdempotent(
      client,
      request.headers.get("idempotency-key"),
      "POST:/api/v1/admin/products/bulk",
      raw,
      async () => {
        const results: unknown[] = [];
        let created = 0;
        for (const [index, candidate] of products.entries()) {
          try {
            const input = createProductSchema.parse(candidate);
            const outcome = await createAdminProduct(client, input, source);
            created += 1;
            results.push({ index, success: true, id: outcome.product.id, warnings: outcome.warnings });
          } catch (error) {
            const normalized = asAdminApiError(error);
            results.push({
              index,
              success: false,
              error: { code: normalized.code, message: normalized.message, details: normalized.details },
            });
          }
        }
        const failed = products.length - created;
        return {
          data: { total_received: products.length, created, failed, results },
          status: failed ? 207 : 201,
        };
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

export async function PATCH(request: Request) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "products-bulk", limit: 20 });
    const raw = await readJsonBody(request, 5_000_000);
    const parsed = bulkUpdateSchema.parse(raw);
    const updates = "updates" in parsed
      ? parsed.updates
      : parsed.ids.map((id) => ({ id, changes: parsed.changes }));
    const results: unknown[] = [];
    let modified = 0;
    for (const [index, update] of updates.entries()) {
      try {
        const changes = patchProductSchema.parse(update.changes);
        const outcome = await updateAdminProduct(client, update.id, changes, source);
        modified += 1;
        results.push({ index, id: update.id, success: true, warnings: outcome.warnings });
      } catch (error) {
        const normalized = asAdminApiError(error);
        results.push({
          index,
          id: update.id,
          success: false,
          error: { code: normalized.code, message: normalized.message, details: normalized.details },
        });
      }
    }
    const failed = updates.length - modified;
    return successResponse(
      { total_received: updates.length, modified, failed, results },
      { status: failed ? 207 : 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

