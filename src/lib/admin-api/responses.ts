import { NextResponse } from "next/server";
import { asAdminApiError } from "@/lib/admin-api/errors";

type SuccessOptions = {
  status?: number;
  warnings?: string[];
  meta?: Record<string, unknown>;
  headers?: HeadersInit;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export function successResponse(data: unknown, options: SuccessOptions = {}) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(options.warnings?.length ? { warnings: options.warnings } : {}),
      ...(options.meta ? { meta: options.meta } : {}),
    },
    {
      status: options.status ?? 200,
      headers: { ...NO_STORE_HEADERS, ...options.headers },
    },
  );
}

export function errorResponse(error: unknown) {
  const normalized = asAdminApiError(error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      },
    },
    { status: normalized.status, headers: NO_STORE_HEADERS },
  );
}

