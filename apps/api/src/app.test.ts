import request from 'supertest';

import { createApp } from './app';
import { createLogger } from './config/logger';

const logger = createLogger('silent');

function buildApp(corsOrigins: string[] = []) {
  return createApp({ corsOrigins, logger });
}

describe('GET /api/v1/health', () => {
  it('returns the ok envelope', async () => {
    const res = await request(buildApp()).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ok' });
    expect(typeof res.body.meta.timestamp).toBe('string');
  });
});

describe('error responses', () => {
  it('returns a NOT_FOUND envelope for unknown routes', async () => {
    const res = await request(buildApp()).get('/api/v1/unknown');

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Route GET /api/v1/unknown not found',
    });
  });

  it('returns a BAD_REQUEST envelope for malformed JSON', async () => {
    const res = await request(buildApp())
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('security headers and CORS', () => {
  it('sets helmet security headers', async () => {
    const res = await request(buildApp()).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows configured origins only', async () => {
    const app = buildApp(['http://localhost:8081']);

    const allowed = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:8081');
    const denied = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:8081'
    );
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
