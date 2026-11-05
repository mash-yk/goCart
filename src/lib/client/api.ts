import type { ApiErrorBody } from "@/types";

/** Error thrown by apiFetch with the server's error code, message and field errors. */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Thin fetch wrapper for the app's own API: JSON in, JSON out, typed errors. */
export async function apiFetch<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: { Accept: "application/json", ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "You appear to be offline. Check your connection and try again.");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    const details = body?.error?.details as { fieldErrors?: Record<string, string> } | undefined;
    throw new ApiClientError(
      response.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? "Something went wrong. Please try again.",
      details?.fieldErrors ?? {},
    );
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
