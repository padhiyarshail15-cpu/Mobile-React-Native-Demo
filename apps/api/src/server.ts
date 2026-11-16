import { createApp } from './app';
import { parseEnv } from './config/env';
import { createLogger } from './config/logger';

const env = parseEnv();
const logger = createLogger(env.LOG_LEVEL);
const app = createApp({ corsOrigins: env.CORS_ORIGINS, logger });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'API listening');
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'Shutting down');
  server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
