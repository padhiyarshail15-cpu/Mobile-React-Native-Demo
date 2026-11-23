import { isAxiosError } from 'axios';

export type ApiErrorKind =
  | 'network' // no response at all (offline, DNS, server down)
  | 'timeout' // no answer within the timeout
  | 'server_waking' // 502/503/504: Render's free tier is starting up
  | 'server' // other 5xx
  | 'validation' // 400 from our API, with per-field details
  | 'not_found' // 404 from our API
  | 'client' // other 4xx
  | 'invalid_response'; // 2xx, but not the { data, meta } envelope

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Worth trying again: the problem is probably temporary.
  get retryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'server_waking' ||
      this.kind === 'server'
    );
  }
}

const MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  timeout: 'The server took too long to respond. Please try again.',
  server_waking:
    'The server is waking up. This can take up to a minute, so please try again shortly.',
  server: 'Something went wrong on our side. Please try again.',
  invalid_response: 'Received an unexpected response from the server.',
  fallback: 'Something went wrong. Please try again.',
} as const;

interface ErrorBody {
  code?: string;
  message?: string;
  details?: ApiErrorDetail[];
}

function readErrorBody(data: unknown): ErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return {};
  }
  const error = (data as { error: unknown }).error;
  if (typeof error !== 'object' || error === null) {
    return {};
  }
  const { code, message, details } = error as Record<string, unknown>;
  return {
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
    details: Array.isArray(details) ? (details as ApiErrorDetail[]) : undefined,
  };
}

function fromStatus(status: number, data: unknown): ApiError {
  const body = readErrorBody(data);

  if (status === 502 || status === 503 || status === 504) {
    return new ApiError('server_waking', MESSAGES.server_waking, status);
  }
  if (status >= 500) {
    return new ApiError('server', MESSAGES.server, status, body.code);
  }
  // 4xx messages come from our own API and are written for users.
  const message = body.message ?? MESSAGES.fallback;
  if (status === 404) {
    return new ApiError('not_found', message, status, body.code);
  }
  if (status === 400) {
    return new ApiError('validation', message, status, body.code, body.details);
  }
  return new ApiError('client', message, status, body.code, body.details);
}

// Turns anything thrown during a request into an ApiError.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAxiosError(error)) {
    if (error.response) {
      return fromStatus(error.response.status, error.response.data);
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('timeout', MESSAGES.timeout);
    }
    return new ApiError('network', MESSAGES.network);
  }
  return new ApiError('client', MESSAGES.fallback);
}

export interface ApiEnvelope<T, M = Record<string, unknown>> {
  data: T;
  meta: M;
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    (value as { data: unknown }).data !== undefined
  );
}

// A 200 that is not our envelope is not our API (for example a proxy's HTML page).
export function unwrapEnvelope<T, M = Record<string, unknown>>(
  body: unknown
): ApiEnvelope<T, M> {
  if (!isApiEnvelope(body)) {
    throw new ApiError('invalid_response', MESSAGES.invalid_response);
  }
  const meta = (body as { meta?: unknown }).meta;
  return {
    data: body.data as T,
    meta: (typeof meta === 'object' && meta !== null ? meta : {}) as M,
  };
}

// Used as React Query's retry rule (see queryClient.ts).
export function isRetryableError(error: unknown): boolean {
  return error instanceof ApiError && error.retryable;
}
