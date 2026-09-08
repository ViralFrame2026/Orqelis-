import { ZodError } from "zod";

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export function asAdminApiError(error: unknown): AdminApiError {
  if (error instanceof AdminApiError) return error;
  if (error instanceof ZodError) {
    return new AdminApiError(
      422,
      "VALIDATION_ERROR",
      "Hay datos inválidos o faltantes.",
      error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    );
  }

  console.error("Admin API error:", error);
  return new AdminApiError(
    500,
    "INTERNAL_ERROR",
    "No se pudo completar la operación.",
  );
}

