import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  previewGoogleDriveCatalog: vi.fn(),
  publishGoogleDriveCatalog: vi.fn(),
  runIdempotent: vi.fn(),
}));

vi.mock("@/lib/admin-api/guard", () => ({ requireAdminApi: mocks.requireAdminApi }));
vi.mock("@/lib/admin-api/idempotency", () => ({ runIdempotent: mocks.runIdempotent }));
vi.mock("@/services/admin-google-drive-import", () => ({
  previewGoogleDriveCatalog: mocks.previewGoogleDriveCatalog,
  publishGoogleDriveCatalog: mocks.publishGoogleDriveCatalog,
}));

import { POST as previewImport } from "@/app/api/v1/admin/imports/google-drive/preview/route";
import { POST as publishImport } from "@/app/api/v1/admin/imports/google-drive/publish/route";

const sheetUrl = "https://docs.google.com/spreadsheets/d/abc_DEF-123/edit";
const sheetHash = "a".repeat(64);

beforeEach(() => {
  mocks.requireAdminApi.mockResolvedValue({ client: {}, source: "ai" });
  mocks.previewGoogleDriveCatalog.mockReset();
  mocks.publishGoogleDriveCatalog.mockReset();
  mocks.runIdempotent.mockReset();
  mocks.runIdempotent.mockImplementation(async (_client, _key, _scope, _input, operation) => ({
    result: await operation(),
    replayed: false,
  }));
});

describe("rutas del importador", () => {
  it("permite revisar la planilla sin publicar", async () => {
    mocks.previewGoogleDriveCatalog.mockResolvedValue({ sheet_hash: sheetHash, rows: [] });
    const response = await previewImport(new Request("http://localhost/api/v1/admin/imports/google-drive/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sheet_url: sheetUrl }),
    }));
    expect(response.status).toBe(200);
    expect(mocks.previewGoogleDriveCatalog).toHaveBeenCalledWith({}, sheetUrl);
  });

  it("exige idempotencia para publicar", async () => {
    const response = await publishImport(new Request("http://localhost/api/v1/admin/imports/google-drive/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sheet_url: sheetUrl, expected_sheet_hash: sheetHash, row_numbers: [2] }),
    }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
  });

  it("publica solamente las filas confirmadas", async () => {
    mocks.publishGoogleDriveCatalog.mockResolvedValue({ total_selected: 1, created: 1, failed: 0 });
    const response = await publishImport(new Request("http://localhost/api/v1/admin/imports/google-drive/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "drive-import-001",
      },
      body: JSON.stringify({ sheet_url: sheetUrl, expected_sheet_hash: sheetHash, row_numbers: [2] }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.publishGoogleDriveCatalog.mock.calls[0][1]).toMatchObject({
      sheetUrl,
      expectedSheetHash: sheetHash,
      rowNumbers: [2],
    });
  });
});
