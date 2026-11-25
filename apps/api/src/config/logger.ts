import pino from 'pino';

import type { Env } from './env';

export type Logger = pino.Logger;

export function createLogger(level: Env['LOG_LEVEL']): Logger {
  return pino({
    level,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });
}
