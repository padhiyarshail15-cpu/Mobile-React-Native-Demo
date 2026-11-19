import { parseEnv } from './env';

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/postgres';

describe('parseEnv', () => {
  it('applies defaults when optional variables are unset', () => {
    expect(parseEnv({ DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      LOG_LEVEL: 'info',
      DATABASE_URL,
      CORS_ORIGINS: [],
    });
  });

  it('coerces PORT and splits CORS_ORIGINS', () => {
    const env = parseEnv({
      DATABASE_URL,
      PORT: '5050',
      CORS_ORIGINS: ' http://a.test , http://b.test ,',
    });

    expect(env.PORT).toBe(5050);
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('throws a readable error for invalid values', () => {
    expect(() => parseEnv({ DATABASE_URL, PORT: '99999' })).toThrow(
      /Invalid environment configuration: PORT:/
    );
    expect(() => parseEnv({ DATABASE_URL, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV:/
    );
  });

  it('requires DATABASE_URL', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL:/);
  });

  it('rejects a DATABASE_URL that is not a Postgres URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://x' })).toThrow(
      /DATABASE_URL: must start with postgres/
    );
  });
});
