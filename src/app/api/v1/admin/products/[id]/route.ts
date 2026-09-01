import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api/guard";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { patchProductSchema } from "@/lib/admin-api/schemas";
import { archiveAdminProduct, getAdminProduct, updateAdminProduct } from "@/services/admin-products";

type RouteContext = { params: Promise<{ id: string }> };

async function validId(context: RouteContext) {
  return z.uuid("El identificador del producto no es válido.").parse((await context.params).id);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { client } = await requireAdminApi(request, { scope: "products-read" });
    return successResponse(await getAdminProduct(client, await validId(context)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "products-write", limit: 60 });
    const id = await validId(context);
    const input = patchProductSchema.parse(await readJsonBody(request));
    const updated = await updateAdminProduct(client, id, input, source);
    return successResponse(updated.product, { warnings: updated.warnings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "products-write", limit: 60 });
    const product = await archiveAdminProduct(client, await validId(context), source);
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}

