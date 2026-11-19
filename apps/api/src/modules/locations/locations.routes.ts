import { Router } from 'express';

import { parseInput } from '../../middleware/validate';

import {
  locationParamsSchema,
  nearestQuerySchema,
  searchQuerySchema,
} from './locations.schemas';
import { NEAREST_MAX_KM, type LocationsService } from './locations.service';

// Order matters: fixed paths (/search, /popular, /nearest) must be declared
// before /:locationId, or "search" would be read as an id.
export function createLocationsRouter(service: LocationsService): Router {
  const router = Router();

  router.get('/search', async (req, res) => {
    const params = parseInput(searchQuerySchema, req.query);
    const data = await service.search(params);
    res.json({ data, meta: { count: data.length, limit: params.limit } });
  });

  router.get('/popular', async (_req, res) => {
    const data = await service.popular();
    res.json({ data, meta: { count: data.length } });
  });

  router.get('/nearest', async (req, res) => {
    const { lat, lon } = parseInput(nearestQuerySchema, req.query);
    const data = await service.nearest(lat, lon);
    res.json({ data, meta: { maxDistanceKm: NEAREST_MAX_KM } });
  });

  router.get('/:locationId', async (req, res) => {
    const { locationId } = parseInput(locationParamsSchema, req.params);
    const data = await service.getById(locationId);
    res.json({ data, meta: {} });
  });

  return router;
}
