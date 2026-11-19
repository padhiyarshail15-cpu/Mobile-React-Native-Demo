import { Pool } from 'pg';

import type { Logger } from '../config/logger';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function createPool(databaseUrl: string, logger: Logger): Pool {
  const { hostname } = new URL(databaseUrl);

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Supabase's pooler certificate chain is not in Node's trust store, so
    // the connection is encrypted but the certificate is not verified.
    ssl: LOCAL_HOSTS.has(hostname) ? false : { rejectUnauthorized: false },
  });

  // Without this listener an error on an idle client crashes the process.
  pool.on('error', err => {
    logger.error({ err }, 'Unexpected error on idle database client');
  });

  return pool;
}
