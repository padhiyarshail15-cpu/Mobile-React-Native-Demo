import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';

import { ApiError } from '../src/api/errorMapper';
import {
  REQUEST_TIMEOUT_MS,
  apiGet,
  createHttpClient,
} from '../src/api/httpClient';

function clientWith(
  respond: (config: InternalAxiosRequestConfig) => {
    status: number;
    data: unknown;
  }
) {
  const client = createHttpClient('https://api.test/api/v1');
  const adapter: AxiosAdapter = async config => {
    const { status, data } = respond(config);
    const response = {
      status,
      statusText: String(status),
      data,
      headers: {},
      config,
    };
    if (status >= 400) {
      throw new AxiosError(
        'failed',
        'ERR_BAD_RESPONSE',
        config,
        undefined,
        response
      );
    }
    return response;
  };
  client.defaults.adapter = adapter;
  return client;
}

describe('createHttpClient', () => {
  it('sets the base URL, a 60 s timeout and a JSON accept header', () => {
    const client = createHttpClient('https://api.test/api/v1');

    expect(client.defaults.baseURL).toBe('https://api.test/api/v1');
    expect(client.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
    expect(REQUEST_TIMEOUT_MS).toBe(60_000);
    expect(client.defaults.headers.Accept).toBe('application/json');
  });
});

describe('apiGet', () => {
  it('returns data and meta, sending only the params that are set', async () => {
    let seen: InternalAxiosRequestConfig | undefined;
    const client = clientWith(config => {
      seen = config;
      return { status: 200, data: { data: [{ id: 1 }], meta: { count: 1 } } };
    });

    const result = await apiGet('/locations/search', {
      params: { q: 'ahm', type: undefined },
      client,
    });

    expect(result).toEqual({ data: [{ id: 1 }], meta: { count: 1 } });
    expect(seen?.url).toBe('/locations/search');
    expect(seen?.params).toEqual({ q: 'ahm', type: undefined });
  });

  it('throws an ApiError built from the API error envelope', async () => {
    const client = clientWith(() => ({
      status: 400,
      data: { error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } },
    }));

    await expect(apiGet('/x', { client })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'validation',
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws invalid_response when a 200 is not the envelope', async () => {
    const client = clientWith(() => ({
      status: 200,
      data: '<html>Render is starting</html>',
    }));

    const error = await apiGet('/x', { client }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('invalid_response');
  });
});
