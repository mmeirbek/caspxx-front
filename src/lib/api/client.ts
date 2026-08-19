import { z } from "zod";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const DEFAULT_TIMEOUT = 15_000; // ms

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export class NoBackendError extends ApiError {
  constructor() {
    super("Backend is not configured", "NO_BACKEND", 0);
    this.name = "NoBackendError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  auth?: string | null; // Bearer token
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  if (!API_BASE_URL) throw new NoBackendError();
  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, formData, headers = {}, signal, auth } = options;

  const url = buildUrl(path, query);

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (auth) finalHeaders.Authorization = `Bearer ${auth}`;

  let init: RequestInit = { method, headers: finalHeaders, signal };
  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    init = { ...init, headers: finalHeaders, body: JSON.stringify(body) };
  }

  const timeoutSignal = new AbortController();
  const timeout = setTimeout(() => timeoutSignal.abort(), DEFAULT_TIMEOUT);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal.signal]) : timeoutSignal.signal;

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: combined });
  } catch (err) {
    if ((err as Error).name === "AbortError" && signal?.aborted) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError("Request timed out", "TIMEOUT", 408);
    }
    throw new ApiError((err as Error).message || "Network error", "NETWORK_ERROR", 0);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const parsed: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const err = parsed as { message?: string; error?: string; statusCode?: number } | null;
    const code = err?.error ?? `HTTP_${response.status}`;
    const message = err?.message ?? `Request failed with ${response.status}`;
    throw new ApiError(message, code, response.status);
  }

  return parsed as T;
}

export const apiPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});

export interface Paginated<T> {
  items: T[];
  meta: z.infer<typeof apiPaginationSchema> | null;
}
