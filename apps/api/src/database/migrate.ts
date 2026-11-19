import path from 'node:path';

import { parseEnv } from '../config/env';
import { createLogger } from '../config/logger';

import { readMigrationFiles, runMigrations } from './migrations';
import { createPool } from './pool';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function main(): Promise<void> {
  const env = parseEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const pool = createPool(env.DATABASE_URL, logger);

  try {
    const files = await readMigrationFiles(MIGRATIONS_DIR);
    const applied = await runMigrations(pool, files, logger);
    logger.info(
      { applied: applied.length, total: files.length },
      applied.length === 0 ? 'Database is up to date' : 'Migrations complete'
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
