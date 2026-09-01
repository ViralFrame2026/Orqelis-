import { createInterface } from "node:readline";

const input = await new Promise((resolve) => {
  const reader = createInterface({ input: process.stdin, terminal: false });
  reader.once("line", (line) => {
    reader.close();
    resolve(JSON.parse(line));
  });
});

const { adminApiKey, serviceRoleKey, siteUrl, supabaseUrl } = input;
const apiBase = `${siteUrl}/api/v1/admin`;
const suffix = Date.now();
const idempotencyKey = `production-check-${suffix}`;
let temporaryProductId = null;

async function adminRequest(path, options = {}) {
  return fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminApiKey}`,
      "X-Orqelis-Source": "api",
      ...(options.headers ?? {}),
    },
  });
}

async function jsonSummary(response) {
  const body = await response.json();
  return { status: response.status, body };
}

async function cleanup(table, filter) {
  await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
  });
}

const report = {};
try {
  report.health = await jsonSummary(await fetch(`${apiBase}/health`));
  report.invalid_auth = await jsonSummary(await fetch(`${apiBase}/products`, {
    headers: { Authorization: "Bearer invalid-production-check" },
  }));
  const products = await jsonSummary(await adminRequest("/products?limit=5"));
  report.products = {
    status: products.status,
    success: products.body.success,
    returned: Array.isArray(products.body.data) ? products.body.data.length : null,
    total: products.body.meta?.total ?? null,
  };
  const categories = await jsonSummary(await adminRequest("/categories"));
  report.categories = {
    status: categories.status,
    success: categories.body.success,
    returned: Array.isArray(categories.body.data) ? categories.body.data.length : null,
  };

  const productPayload = {
    name: `Verificación temporal ORQELIS ${suffix}`,
    sku: `VERIFY-${suffix}`,
    category: "bazar",
    short_description: "Registro temporal para verificar la API.",
    description: "Este registro se elimina automáticamente al finalizar la verificación.",
    price: "12.345",
    status: "hidden",
    featured: false,
    offer: false,
    is_new: false,
    tags: ["verificacion"],
    features: ["Registro temporal"],
    images: [],
  };

  const preview = await jsonSummary(await adminRequest("/products/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productPayload),
  }));
  report.preview = {
    status: preview.status,
    success: preview.body.success,
    normalized_price: preview.body.data?.price ?? null,
    can_create: preview.body.meta?.can_create ?? null,
  };

  const createOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(productPayload),
  };
  const firstResponse = await adminRequest("/products", createOptions);
  const firstBody = await firstResponse.json();
  temporaryProductId = firstBody.data?.id ?? null;
  const secondResponse = await adminRequest("/products", createOptions);
  const secondBody = await secondResponse.json();
  report.idempotent_create = {
    first_status: firstResponse.status,
    second_status: secondResponse.status,
    same_id: Boolean(temporaryProductId && temporaryProductId === secondBody.data?.id),
    replayed: secondResponse.headers.get("x-idempotent-replayed") === "true",
  };

  if (temporaryProductId) {
    const bulk = await jsonSummary(await adminRequest("/products/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: [
          { id: temporaryProductId, changes: { offer: true } },
          { id: "11111111-1111-4111-8111-111111111111", changes: { offer: true } },
        ],
      }),
    }));
    report.bulk_partial = {
      status: bulk.status,
      modified: bulk.body.data?.modified ?? null,
      failed: bulk.body.data?.failed ?? null,
    };

    const edit = await jsonSummary(await adminRequest(`/products/${temporaryProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: "23.456", stock: 7 }),
    }));
    report.edit = {
      status: edit.status,
      price: edit.body.data?.price ?? null,
      stock: edit.body.data?.stock ?? null,
    };

    const archive = await jsonSummary(await adminRequest(`/products/${temporaryProductId}`, {
      method: "DELETE",
    }));
    report.archive = {
      status: archive.status,
      state: archive.body.data?.status ?? null,
    };
  }

  const invalidForm = new FormData();
  invalidForm.append("file", new Blob([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], { type: "image/jpeg" }), "falso.jpg");
  const invalidUpload = await jsonSummary(await adminRequest("/uploads", {
    method: "POST",
    body: invalidForm,
  }));
  report.invalid_upload = {
    status: invalidUpload.status,
    code: invalidUpload.body.error?.code ?? null,
  };
} finally {
  if (temporaryProductId) {
    await cleanup("products", `id=eq.${encodeURIComponent(temporaryProductId)}`);
    await cleanup("admin_activity_log", `entity_id=eq.${encodeURIComponent(temporaryProductId)}`);
  }
  await cleanup("admin_api_idempotency", `idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`);
}

process.stdout.write(`RESULT_JSON:${JSON.stringify(report)}\n`);
