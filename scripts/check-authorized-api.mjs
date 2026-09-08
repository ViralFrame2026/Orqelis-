import { createInterface } from "node:readline";

async function readInput() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return new Promise((resolve) => {
      const reader = createInterface({ input: process.stdin, terminal: false });
      reader.once("line", (line) => {
        reader.close();
        resolve(JSON.parse(line));
      });
    });
  }

  process.stdin.setRawMode(true);
  process.stdin.resume();
  let line = "";

  return new Promise((resolve, reject) => {
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    process.stdin.on("data", (chunk) => {
      const value = chunk.toString("utf8");
      if (value.includes("\u0003")) {
        finish();
        reject(new Error("Entrada cancelada."));
        return;
      }

      const end = value.search(/[\r\n]/);
      line += end >= 0 ? value.slice(0, end) : value;
      if (end >= 0) {
        finish();
        resolve(JSON.parse(line));
      }
    });
  });
}

const input = await readInput();

const base = `${input.siteUrl}/api/v1/admin`;
const headers = { Authorization: `Bearer ${input.adminApiKey}` };

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  const body = await response.json();
  return { response, body };
}

const products = await request("/products?limit=5");
const categories = await request("/categories");
const preview = await request("/products/preview", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Orqelis-Source": "ai" },
  body: JSON.stringify({
    name: `Vista previa ORQELIS ${Date.now()}`,
    category: "bazar",
    short_description: "Validación sin publicación.",
    description: "Esta previsualización no escribe información.",
    price: "55.000",
    status: "hidden",
  }),
});

const report = {
  products: {
    status: products.response.status,
    success: products.body.success,
    returned: Array.isArray(products.body.data) ? products.body.data.length : null,
    total: products.body.meta?.total ?? null,
  },
  categories: {
    status: categories.response.status,
    success: categories.body.success,
    returned: Array.isArray(categories.body.data) ? categories.body.data.length : null,
  },
  preview: {
    status: preview.response.status,
    success: preview.body.success,
    normalized_price: preview.body.data?.price ?? null,
    can_create: preview.body.meta?.can_create ?? null,
  },
};

process.stdout.write(`RESULT_JSON:${JSON.stringify(report)}\n`);
