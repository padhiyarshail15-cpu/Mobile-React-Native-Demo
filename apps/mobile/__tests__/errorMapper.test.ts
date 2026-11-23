import { AxiosError, type AxiosResponse } from 'axios';

import {
  ApiError,
  isRetryableError,
  toApiError,
  unwrapEnvelope,
} from '../src/api/errorMapper';

function responseError(status: number, data: unknown): AxiosError {
  const response = { status, data } as AxiosResponse;
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, {}, response);
}

describe('toApiError', () => {
  it('maps a missing response to a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));

    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/Can't reach the server/);
    expect(error.retryable).toBe(true);
  });

  it.each(['ECONNABORTED', 'ETIMEDOUT'])('maps %s to a timeout', code => {
    const error = toApiError(new AxiosError('timeout', code));

    expect(error.kind).toBe('timeout');
    expect(error.retryable).toBe(true);
  });

  it.each([502, 503, 504])(
    'explains that the server is waking up on %i',
    status => {
      const error = toApiError(
        responseError(status, '<html>bad gateway</html>')
      );

      expect(error.kind).toBe('server_waking');
      expect(error.message).toMatch(/waking up/);
      expect(error.status).toBe(status);
      expect(error.retryable).toBe(true);
    }
  );

  it('maps other 5xx to a generic server error and hides the body', () => {
    const error = toApiError(
      responseError(500, {
        error: { code: 'INTERNAL_ERROR', message: 'secret' },
      })
    );

    expect(error.kind).toBe('server');
    expect(error.message).not.toContain('secret');
    expect(error.retryable).toBe(true);
  });

  it('keeps the code, message and field details of a 400 from our API', () => {
    const details = [{ field: 'q', message: 'must be at least 2 characters' }];
    const error = toApiError(
      responseError(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details,
        },
      })
    );

    expect(error.kind).toBe('validation');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid request');
    expect(error.details).toEqual(details);
    expect(error.retryable).toBe(false);
  });

  it('maps a 404 to not_found without retrying', () => {
    const error = toApiError(
      responseError(404, {
        error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found' },
      })
    );

    expect(error.kind).toBe('not_found');
    expect(error.code).toBe('LOCATION_NOT_FOUND');
    expect(error.retryable).toBe(false);
  });

  it('falls back to a generic message when a 4xx has no usable body', () => {
    const error = toApiError(responseError(429, '<html>slow down</html>'));

    expect(error.kind).toBe('client');
    expect(error.message).toBe('Something went wrong. Please try again.');
  });

  it('returns an existing ApiError unchanged', () => {
    const original = new ApiError('network', 'x');

    expect(toApiError(original)).toBe(original);
  });

  it('wraps unknown errors in a safe message', () => {
    const error = toApiError(new TypeError('cannot read x of undefined'));

    expect(error.kind).toBe('client');
    expect(error.message).not.toContain('cannot read');
  });
});

describe('unwrapEnvelope', () => {
  it('returns data and meta', () => {
    expect(unwrapEnvelope({ data: [1], meta: { count: 1 } })).toEqual({
      data: [1],
      meta: { count: 1 },
    });
  });

  it('defaults meta to an empty object', () => {
    expect(unwrapEnvelope({ data: 'x' })).toEqual({ data: 'x', meta: {} });
  });

  it.each([
    ['an HTML page', '<html></html>'],
    ['null', null],
    ['an object without data', { hello: 'world' }],
    ['an object with undefined data', { data: undefined }],
  ])('rejects %s as an invalid response', (_label, body) => {
    expect(() => unwrapEnvelope(body)).toThrow(ApiError);
    expect(() => unwrapEnvelope(body)).toThrow(/unexpected response/);
  });
});

describe('isRetryableError', () => {
  it('is true only for temporary ApiErrors', () => {
    expect(isRetryableError(new ApiError('timeout', 'x'))).toBe(true);
    expect(isRetryableError(new ApiError('validation', 'x'))).toBe(false);
    expect(isRetryableError(new ApiError('invalid_response', 'x'))).toBe(false);
    expect(isRetryableError(new Error('plain'))).toBe(false);
  });
});
