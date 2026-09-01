import { z } from "zod";
import {
  normalizeBooleanInput,
  normalizeIntegerInput,
  normalizeNumericInput,
  normalizeStringList,
} from "@/lib/admin-api/normalization";

const nullableMoney = z.preprocess(
  (value) => (value === "" || value === undefined ? null : normalizeNumericInput(value)),
  z.number().finite().min(0, "No puede ser negativo").nullable(),
);
const money = z.preprocess(
  normalizeNumericInput,
  z.number().finite().min(0, "No puede ser negativo"),
);
const nullableInteger = z.preprocess(
  (value) => (value === "" || value === undefined ? null : normalizeIntegerInput(value)),
  z.number().int().min(0, "No puede ser negativo").nullable(),
);
const positiveNullableInteger = z.preprocess(
  (value) => (value === "" || value === undefined ? null : normalizeIntegerInput(value)),
  z.number().int().positive("Debe ser mayor que cero").nullable(),
);
const tolerantBoolean = z.preprocess(normalizeBooleanInput, z.boolean());
const cleanText = (max: number) => z.string().trim().max(max);
const requiredText = (field: string, max: number) =>
  z.string().trim().min(1, `${field} es obligatorio`).max(max);
const stringList = z.preprocess(
  normalizeStringList,
  z.array(z.string().trim().min(1).max(300)).max(100),
);

const statusAliases: Record<string, string> = {
  published: "available",
  publicado: "available",
  disponible: "available",
  draft: "hidden",
  oculto: "hidden",
  agotado: "sold_out",
  archivado: "archived",
};

export const productStatusSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim().toLowerCase().replace(/[ -]+/g, "_");
    return statusAliases[normalized] ?? normalized;
  },
  z.enum(["available", "last_units", "sold_out", "coming_soon", "hidden", "archived"]),
);

const imageObjectSchema = z
  .object({
    url: z.url().optional(),
    image_url: z.url().optional(),
    position: z.preprocess(normalizeIntegerInput, z.number().int().min(0)).optional(),
    is_primary: tolerantBoolean.optional(),
  })
  .refine((value) => Boolean(value.url || value.image_url), {
    message: "La imagen necesita url o image_url",
  });

export const productImageInputSchema = z.union([z.url(), imageObjectSchema]).transform((value) => {
  if (typeof value === "string") return { image_url: value, position: undefined, is_primary: false };
  return {
    image_url: value.image_url ?? value.url!,
    position: value.position,
    is_primary: value.is_primary ?? false,
  };
});

const sharedProductFields = {
  slug: cleanText(180).optional(),
  sku: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().trim().min(1).max(120).nullable(),
  ).optional().default(null),
  category: requiredText("category", 180),
  short_description: cleanText(500),
  description: cleanText(10_000),
  price: money,
  previous_price: nullableMoney.optional().default(null),
  installments: positiveNullableInteger.optional().default(null),
  installment_price: nullableMoney.optional().default(null),
  stock: nullableInteger.optional().default(null),
  status: productStatusSchema,
  featured: tolerantBoolean.optional().default(false),
  offer: tolerantBoolean.optional().default(false),
  is_new: tolerantBoolean.optional().default(false),
  tags: stringList.optional().default([]),
  features: stringList.optional().default([]),
  images: z.array(productImageInputSchema).max(30).optional().default([]),
};

export const createProductSchema = z
  .object({
    name: requiredText("name", 220),
    ...sharedProductFields,
  })
  .strict();

export const patchProductSchema = z
  .object({
    name: requiredText("name", 220).optional(),
    slug: cleanText(180).optional(),
    sku: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().trim().min(1).max(120).nullable(),
    ).optional(),
    category: requiredText("category", 180).optional(),
    short_description: cleanText(500).optional(),
    description: cleanText(10_000).optional(),
    price: money.optional(),
    previous_price: nullableMoney.optional(),
    installments: positiveNullableInteger.optional(),
    installment_price: nullableMoney.optional(),
    stock: nullableInteger.optional(),
    status: productStatusSchema.optional(),
    featured: tolerantBoolean.optional(),
    offer: tolerantBoolean.optional(),
    is_new: tolerantBoolean.optional(),
    tags: stringList.optional(),
    features: stringList.optional(),
    images: z.array(productImageInputSchema).max(30).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Debe enviar al menos un campo para modificar",
  });

export const productFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(180).optional(),
  status: productStatusSchema.optional(),
  featured: tolerantBoolean.optional(),
  offer: tolerantBoolean.optional(),
  limit: z.preprocess(normalizeIntegerInput, z.number().int().min(1).max(200)).optional().default(50),
  offset: z.preprocess(normalizeIntegerInput, z.number().int().min(0)).optional().default(0),
});

export const bulkCreateSchema = z.object({
  products: z.array(z.unknown()).min(1).max(100),
}).strict();

export const googleDriveImportPreviewSchema = z.object({
  sheet_url: z.url().max(2_048),
}).strict();

export const googleDriveImportPublishSchema = z.object({
  sheet_url: z.url().max(2_048),
  expected_sheet_hash: z.string().trim().regex(/^[a-f0-9]{64}$/i, "El hash de la planilla no es válido."),
  row_numbers: z.array(z.number().int().min(2)).min(1).max(20).optional(),
}).strict().refine(
  (value) => !value.row_numbers || new Set(value.row_numbers).size === value.row_numbers.length,
  { message: "row_numbers no puede contener filas repetidas.", path: ["row_numbers"] },
);

const bulkUpdateItemSchema = z.object({
  id: z.uuid(),
  changes: z.unknown(),
}).strict();

export const bulkUpdateSchema = z.union([
  z.object({ updates: z.array(bulkUpdateItemSchema).min(1).max(200) }).strict(),
  z.object({ ids: z.array(z.uuid()).min(1).max(200), changes: z.unknown() }).strict(),
]);

export const categoryCreateSchema = z.object({
  name: requiredText("name", 120),
  slug: cleanText(140).optional(),
  icon: cleanText(80).optional().default("Package"),
}).strict();

export const categoryPatchSchema = categoryCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Debe enviar al menos un campo para modificar" },
);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type PatchProductInput = z.infer<typeof patchProductSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
