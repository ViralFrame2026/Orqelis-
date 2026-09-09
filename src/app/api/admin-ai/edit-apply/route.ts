import { NextResponse } from "next/server";
import { patchProductSchema } from "@/lib/admin-api/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/services/auth";
import { getAdminProduct, updateAdminProduct } from "@/services/admin-products";

export async function POST(request: Request) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await request.json();
    const productId = typeof body?.product_id === "string" ? body.product_id : "";
    const parsed = patchProductSchema.safeParse(body?.changes);
    if (!productId) return NextResponse.json({ error: "Falta el producto a modificar." }, { status: 400 });
    if (!parsed.success) {
      return NextResponse.json({
        error: "Los cambios no son válidos.",
        details: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
      }, { status: 422 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

    const before = await getAdminProduct(supabase, productId);
    const result = await updateAdminProduct(supabase, productId, parsed.data, "ai");

    return NextResponse.json({
      product: result.product,
      warnings: result.warnings,
      message: `Cambios aplicados a '${result.product.name}'.`,
      before: {
        price: before.price,
        stock: before.stock,
        status: before.status,
        featured: before.featured,
        offer: before.offer,
      },
    });
  } catch (error) {
    console.error("ORQELIS AI edit-apply error:", error);
    const message = error instanceof Error ? error.message : "No pude aplicar los cambios.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
