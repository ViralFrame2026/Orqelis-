import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "@/lib/admin-api/errors";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  createAdminProduct: vi.fn(),
  updateAdminProduct: vi.fn(),
}));

vi.mock("@/lib/admin-api/guard", () => ({ requireAdminApi: mocks.requireAdminApi }));
vi.mock("@/services/admin-products", () => ({
  createAdminProduct: mocks.createAdminProduct,
  updateAdminProduct: mocks.updateAdminProduct,
  listAdminProducts: vi.fn(),
  getAdminProduct: vi.fn(),
  archiveAdminProduct: vi.fn(),
  previewAdminProduct: vi.fn(),
}));

import { POST as createProduct } from "@/app/api/v1/admin/products/route";
import { PATCH as editProduct } from "@/app/api/v1/admin/products/[id]/route";
import { POST as bulkCreate } from "@/app/api/v1/admin/products/bulk/route";

const productInput = {
  name: "Producto de prueba",
  category: "bazar",
  short_description: "Breve",
  description: "Completa",
  price: "55.000",
  status: "hidden",
};

beforeEach(() => {
  mocks.requireAdminApi.mockResolvedValue({ client: {}, source: "api" });
  mocks.createAdminProduct.mockReset();
  mocks.updateAdminProduct.mockReset();
});

describe("rutas críticas", () => {
  it("crea un producto validado y normalizado", async () => {
    mocks.createAdminProduct.mockImplementation(async (_client, input) => ({
      product: { id: "p1", ...input }, warnings: [],
    }));
    const response = await createProduct(new Request("http://localhost/api/v1/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(productInput),
    }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mocks.createAdminProduct.mock.calls[0][1].price).toBe(55_000);
  });

  it("edita solamente los campos enviados", async () => {
    mocks.updateAdminProduct.mockImplementation(async (_client, id, changes) => ({
      product: { id, ...changes }, warnings: [],
    }));
    const response = await editProduct(
      new Request("http://localhost/api/v1/admin/products/11111111-1111-4111-8111-111111111111", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer: true }),
      }),
      { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.updateAdminProduct.mock.calls[0][2]).toEqual({ offer: true });
  });

  it("continúa una carga masiva cuando un elemento falla", async () => {
    mocks.createAdminProduct
      .mockResolvedValueOnce({ product: { id: "ok" }, warnings: [] })
      .mockRejectedValueOnce(new AdminApiError(409, "DUPLICATE_PRODUCT", "Duplicado"));
    const response = await bulkCreate(new Request("http://localhost/api/v1/admin/products/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ products: [productInput, { ...productInput, name: "Duplicado" }] }),
    }));
    const body = await response.json();
    expect(response.status).toBe(207);
    expect(body.data).toMatchObject({ total_received: 2, created: 1, failed: 1 });
    expect(body.data.results[1].error.code).toBe("DUPLICATE_PRODUCT");
  });
});

