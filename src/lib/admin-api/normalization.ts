import { AdminApiError } from "@/lib/admin-api/errors";

const CURRENCY_PATTERN = /^(?:ars\s*)?\$?\s*([+-]?[0-9][0-9.,]*)\s*(?:ars)?$/i;

export function normalizeNumericInput(value: unknown): unknown {
  if (typeof value === "number") return Number.isFinite(value) ? value : value;
  if (typeof value !== "string") return value;

  const compact = value.trim().replace(/\s+/g, "");
  const match = CURRENCY_PATTERN.exec(compact);
  if (!match) return Number.NaN;
  const raw = match[1];
  const sign = raw.startsWith("-") ? -1 : 1;
  const unsigned = raw.replace(/^[+-]/, "");
  if (!/^\d+(?:[.,]\d+)*$/.test(unsigned)) return Number.NaN;

  const dots = [...unsigned.matchAll(/\./g)].map(({ index }) => index ?? -1);
  const commas = [...unsigned.matchAll(/,/g)].map(({ index }) => index ?? -1);
  let normalized = unsigned;

  if (dots.length && commas.length) {
    const decimalSeparator = dots.at(-1)! > commas.at(-1)! ? "." : ",";
    const groupingSeparator = decimalSeparator === "." ? "," : ".";
    const decimalDigits = unsigned.length - unsigned.lastIndexOf(decimalSeparator) - 1;
    if (decimalDigits < 1 || decimalDigits > 2) return Number.NaN;
    normalized = unsigned.split(groupingSeparator).join("");
    const parts = normalized.split(decimalSeparator);
    if (parts.length !== 2) return Number.NaN;
    normalized = `${parts[0]}.${parts[1]}`;
  } else {
    const separator = dots.length ? "." : commas.length ? "," : null;
    if (separator) {
      const groups = unsigned.split(separator);
      if (groups.length > 2) {
        if (!groups.slice(1).every((group) => group.length === 3)) return Number.NaN;
        normalized = groups.join("");
      } else {
        const decimals = groups[1].length;
        if (decimals === 3) normalized = groups.join("");
        else if (decimals === 1 || decimals === 2) normalized = `${groups[0]}.${groups[1]}`;
        else return Number.NaN;
      }
    }
  }

  const parsed = Number(normalized) * sign;
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function normalizeIntegerInput(value: unknown): unknown {
  const normalized = normalizeNumericInput(value);
  return typeof normalized === "number" && Number.isInteger(normalized)
    ? normalized
    : Number.NaN;
}

export function normalizeBooleanInput(value: unknown): unknown {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "si", "sí", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return value;
}

export function normalizeStringList(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export async function readJsonBody(request: Request, maxBytes = 2_000_000) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new AdminApiError(413, "PAYLOAD_TOO_LARGE", "El cuerpo de la solicitud es demasiado grande.");
  }
  try {
    return await request.json();
  } catch {
    throw new AdminApiError(400, "INVALID_JSON", "El cuerpo debe contener JSON válido.");
  }
}

