import { parseEnv } from '../config/env';
import { createLogger } from '../config/logger';

import { createPool } from './pool';
import { seedLocations } from './seedLocations';

async function main(): Promise<void> {
  const env = parseEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const pool = createPool(env.DATABASE_URL, logger);

  try {
    const count = await seedLocations(pool);
    logger.info({ count }, 'Seeded locations');
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
