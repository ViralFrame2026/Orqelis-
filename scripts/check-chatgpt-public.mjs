const siteUrl = process.argv[2] ?? "https://orqelis-flame.vercel.app";

const [healthResponse, schemaResponse, privacyResponse] = await Promise.all([
  fetch(`${siteUrl}/api/v1/admin/health`, { cache: "no-store" }),
  fetch(`${siteUrl}/orqelis-chatgpt-openapi.yaml`, { cache: "no-store" }),
  fetch(`${siteUrl}/privacidad`, { cache: "no-store" }),
]);

const health = await healthResponse.json();
const schema = await schemaResponse.text();
const privacy = await privacyResponse.text();
const operationIds = [...schema.matchAll(/^\s+operationId:\s+([A-Za-z0-9_]+)\s*$/gm)].map((match) => match[1]);

const report = {
  health: {
    status: healthResponse.status,
    service_status: health.data?.status ?? null,
    chatgpt_key_configured: health.data?.checks?.chatgpt_key_configured ?? null,
    database_reachable: health.data?.checks?.database_reachable ?? null,
  },
  schema: {
    status: schemaResponse.status,
    openapi_3_1: schema.startsWith("openapi: 3.1.0"),
    operations: operationIds.length,
    unique_operations: new Set(operationIds).size,
  },
  privacy: {
    status: privacyResponse.status,
    contains_orqelis: /ORQELIS/i.test(privacy),
  },
};

process.stdout.write(`RESULT_JSON:${JSON.stringify(report)}\n`);
