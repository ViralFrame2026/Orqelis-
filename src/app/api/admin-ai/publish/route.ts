import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-api/audit";
import { createProductSchema } from "@/lib/admin-api/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/services/auth";
import { createAdminProduct } from "@/services/admin-products";
import { uploadAdminImages } from "@/services/admin-uploads";

export async function POST(request: Request) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const formData = await request.formData();
    const draftRaw = String(formData.get("draft") || "");
    const image = formData.get("image");
    if (!draftRaw) return NextResponse.json({ error: "Falta la ficha a publicar." }, { status: 400 });

    let draftJson: unknown;
    try { draftJson = JSON.parse(draftRaw); }
    catch { return NextResponse.json({ error: "La ficha no es válida." }, { status: 400 }); }

    const parsed = createProductSchema.safeParse(draftJson);
    if (!parsed.success) {
      return NextResponse.json({
        error: "La ficha tiene campos inválidos.",
        details: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
      }, { status: 422 });
    }

    if (parsed.data.price <= 0) {
      return NextResponse.json({ error: "Definí un precio mayor que cero antes de publicar." }, { status: 422 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

    let images = parsed.data.images;
    let uploadedImage = false;
    if (image instanceof File && image.size > 0) {
      const uploaded = await uploadAdminImages(supabase, [image], "ai");
      images = uploaded.map((item, index) => ({ image_url: item.url, position: index, is_primary: index === 0 }));
      uploadedImage = uploaded.length > 0;
    }

    const input = { ...parsed.data, images };
    const result = await createAdminProduct(supabase, input, "ai");
    await logAdminActivity(supabase, {
      action: "ai_product_published",
      entityType: "product",
      entityId: result.product.id,
      source: "ai",
      summary: {
        product: result.product.name,
        category: result.product.category?.name ?? parsed.data.category,
        price: result.product.price,
        stock: result.product.stock,
        status: result.product.status,
        featured: result.product.featured,
        offer: result.product.offer,
        image_uploaded: uploadedImage,
      },
    });

    return NextResponse.json({
      product: result.product,
      warnings: result.warnings,
      message: `Producto '${result.product.name}' publicado correctamente.`,
    }, { status: 201 });
  } catch (error) {
    console.error("ORQELIS AI admin publish error:", error);
    const message = error instanceof Error ? error.message : "No pude publicar el producto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
