import { createApp } from './app';
import { parseEnv } from './config/env';
import { createLogger } from './config/logger';
import { createPool } from './database/pool';
import { createLocationsRepository } from './modules/locations/locations.repository';
import { createLocationsService } from './modules/locations/locations.service';

// Composition root: the one place where real dependencies are created and connected.
const env = parseEnv();
const logger = createLogger(env.LOG_LEVEL);
const pool = createPool(env.DATABASE_URL, logger);
const locations = createLocationsService(createLocationsRepository(pool));
const app = createApp({ corsOrigins: env.CORS_ORIGINS, logger, locations });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'API listening');
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    // Close database connections after in-flight requests have finished.
    pool.end().finally(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
