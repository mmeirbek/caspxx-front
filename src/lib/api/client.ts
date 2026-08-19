import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { ApiErrorEnvelope, Paginated, Pagination } from "./types";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const DEFAULT_TIMEOUT = 15_000; // ms

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  constructor(message: string, code: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
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
  auth?: string | null; // module token
  idempotent?: boolean; // adds Idempotency-Key
  trackingToken?: string;
  pushSubscriptionToken?: string;
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
  // If API_BASE_URL is absolute, URL used it as base and origin is our api's origin.
  return url.toString();
}

export interface RawResult<T> {
  data: T;
  meta: Pagination | null;
}

const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});

const successEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: paginationSchema.nullable(),
  timestamp: z.string().datetime(),
});

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const raw = await apiRequestRaw<T>(path, options);
  return raw.data;
}

export async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Paginated<T>> {
  const raw = await apiRequestRaw<T[]>(path, options);
  const meta: Pagination = raw.meta ?? {
    page: 1,
    limit: raw.data.length,
    total: raw.data.length,
    pages: 1,
  };
  return { items: raw.data, meta };
}

export async function apiRequestRaw<T>(
  path: string,
  options: RequestOptions = {},
): Promise<RawResult<T>> {
  const {
    method = "GET",
    query,
    body,
    formData,
    headers = {},
    signal,
    auth,
    idempotent,
    trackingToken,
    pushSubscriptionToken,
  } = options;

  const url = buildUrl(path, query);

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (auth) finalHeaders.Authorization = `Bearer ${auth}`;
  if (idempotent) finalHeaders["Idempotency-Key"] = uuidv4();
  if (trackingToken) finalHeaders["X-Submission-Tracking-Token"] = trackingToken;
  if (pushSubscriptionToken) finalHeaders["X-Push-Subscription-Token"] = pushSubscriptionToken;

  let init: RequestInit = { method, headers: finalHeaders, signal };
  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    init = { ...init, headers: finalHeaders, body: JSON.stringify(body) };
  }


  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError((err as Error).message || "Network error", "NETWORK_ERROR", 0);
  }

  // 204 No Content
  if (response.status === 204) {
    return { data: undefined as T, meta: null };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const parsed: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const err = parsed as ApiErrorEnvelope | null;
    const code = err?.error?.code ?? `HTTP_${response.status}`;
    const message = err?.error?.message ?? `Request failed with ${response.status}`;
    throw new ApiError(message, code, response.status, err?.requestId);
  }

  const envelope = successEnvelopeSchema.safeParse(parsed);
  if (envelope.success) {
    return { data: envelope.data.data as T, meta: envelope.data.meta };
  }
  // Fallback if the backend didn't wrap the payload.
  return { data: parsed as T, meta: null };
}
