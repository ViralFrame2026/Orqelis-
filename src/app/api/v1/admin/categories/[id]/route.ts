import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api/guard";
import { readJsonBody } from "@/lib/admin-api/normalization";
import { errorResponse, successResponse } from "@/lib/admin-api/responses";
import { categoryPatchSchema } from "@/lib/admin-api/schemas";
import { updateAdminCategory } from "@/services/admin-categories";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { client, source } = await requireAdminApi(request, { scope: "categories-write", limit: 60 });
    const id = z.uuid("El identificador de categoría no es válido.").parse((await context.params).id);
    const input = categoryPatchSchema.parse(await readJsonBody(request));
    return successResponse(await updateAdminCategory(client, id, input, source));
  } catch (error) {
    return errorResponse(error);
  }
}

