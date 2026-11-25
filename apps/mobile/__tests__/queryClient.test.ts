import { ApiError } from '../src/api/errorMapper';
import { createQueryClient } from '../src/api/queryClient';

describe('createQueryClient', () => {
  const defaults = createQueryClient().getDefaultOptions().queries!;
  const retry = defaults.retry as (count: number, error: unknown) => boolean;

  it('retries a temporary failure once, then stops', () => {
    const waking = new ApiError('server_waking', 'x', 503);

    expect(retry(0, waking)).toBe(true);
    expect(retry(1, waking)).toBe(false);
  });

  it('never retries input or lookup errors', () => {
    expect(retry(0, new ApiError('validation', 'x', 400))).toBe(false);
    expect(retry(0, new ApiError('not_found', 'x', 404))).toBe(false);
    expect(retry(0, new Error('plain'))).toBe(false);
  });

  it('keeps locations fresh for 5 minutes and does not refetch on focus', () => {
    expect(defaults.staleTime).toBe(5 * 60 * 1000);
    expect(defaults.refetchOnWindowFocus).toBe(false);
  });
});
