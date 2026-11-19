import { Router } from 'express';

import { createLocationsRouter } from '../modules/locations/locations.routes';
import type { LocationsService } from '../modules/locations/locations.service';

export interface ApiDependencies {
  locations: LocationsService;
}

export function createApiRouter({ locations }: ApiDependencies): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      data: { status: 'ok' },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  router.use('/locations', createLocationsRouter(locations));

  return router;
}
