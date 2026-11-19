import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import type { Logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import type { LocationsService } from './modules/locations/locations.service';
import { createApiRouter } from './routes';

export interface AppOptions {
  corsOrigins: string[];
  logger: Logger;
  locations: LocationsService;
}

export function createApp({
  corsOrigins,
  logger,
  locations,
}: AppOptions): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : false }));
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: req => ({ id: req.id, method: req.method, url: req.url }),
        res: res => ({ statusCode: res.statusCode }),
      },
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1', createApiRouter({ locations }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
