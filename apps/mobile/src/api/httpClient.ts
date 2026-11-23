import axios, { type AxiosInstance } from 'axios';

import { env } from '~/config/env';

import { toApiError, unwrapEnvelope, type ApiEnvelope } from './errorMapper';

// Long on purpose: Render's free tier can take up to a minute to wake up.
export const REQUEST_TIMEOUT_MS = 60_000;

export function createHttpClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
  });
}

export const httpClient = createHttpClient(env.apiUrl);

type Params = Record<string, string | number | undefined>;

// Transport only. Retrying, caching and loading state belong to React Query.
// Every failure leaves here as an ApiError; every success as { data, meta }.
export async function apiGet<T, M = Record<string, unknown>>(
  path: string,
  options: {
    params?: Params;
    signal?: AbortSignal;
    client?: AxiosInstance;
  } = {}
): Promise<ApiEnvelope<T, M>> {
  const { params, signal, client = httpClient } = options;
  try {
    const response = await client.get<unknown>(path, { params, signal });
    return unwrapEnvelope<T, M>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
