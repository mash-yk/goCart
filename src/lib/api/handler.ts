import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { AppError, ForbiddenError, ValidationError } from "@/lib/errors";
import type { ApiErrorBody } from "@/types";

type RouteContext<P> = { params: Promise<P> };
type Handler<P> = (request: NextRequest, context: RouteContext<P>) => Promise<Response>;

const MAX_BODY_BYTES = 64 * 1024;
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function json<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function errorResponse(error: AppError): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code: error.code, message: error.message, details: error.details } },
    { status: error.status },
  );
}

/**
 * Rejects state-changing requests that come from another site. Cookies are
 * already SameSite=Lax; this is a second layer of CSRF protection.
 */
function assertSameOrigin(request: NextRequest) {
  if (!UNSAFE_METHODS.has(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin) return; // non-browser clients (curl, server-to-server) send no Origin
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new ForbiddenError("Cross-site requests are not allowed.");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new ForbiddenError("Invalid request origin.");
  }
}

/**
 * Wraps a Route Handler with origin checks and consistent error handling.
 * Known AppErrors become their HTTP status; anything else is logged and returned as a 500
 * without leaking internal details.
 */
export function route<P = Record<string, never>>(handler: Handler<P>): Handler<P> {
  return async (request, context) => {
    try {
      assertSameOrigin(request);
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) return errorResponse(error);
      console.error(`[api] ${request.method} ${request.nextUrl.pathname} failed`, error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." } },
        { status: 500 },
      );
    }
  };
}

/** Reads and size-limits a JSON request body. */
export async function readJson(request: NextRequest): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new ValidationError("Request body is too large.");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ValidationError("Request body is too large.");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
