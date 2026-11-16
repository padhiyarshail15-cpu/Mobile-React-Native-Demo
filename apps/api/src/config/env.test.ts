import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults when variables are unset', () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      LOG_LEVEL: 'info',
      CORS_ORIGINS: [],
    });
  });

  it('coerces PORT and splits CORS_ORIGINS', () => {
    const env = parseEnv({
      PORT: '5050',
      CORS_ORIGINS: ' http://a.test , http://b.test ,',
    });

    expect(env.PORT).toBe(5050);
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('throws a readable error for invalid values', () => {
    expect(() => parseEnv({ PORT: '99999' })).toThrow(
      /Invalid environment configuration: PORT:/
    );
    expect(() => parseEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV:/);
  });
});
