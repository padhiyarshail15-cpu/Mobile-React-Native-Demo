import { z } from 'zod';

import { LOCATION_LEVELS } from './locations.types';

// Query-string values always arrive as strings, so numbers are parsed here.
// A missing value and a repeated value (?q=a&q=b) get different messages.
const text = (label = 'is required') =>
  z.string({
    error: issue =>
      issue.input === undefined ? label : 'must be a single value',
  });

const wholeNumber = (min: number, max: number) =>
  text()
    .regex(/^\d+$/, 'must be a whole number')
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, `must be at least ${min}`)
        .max(max, `must be at most ${max}`)
    );

const coordinate = (min: number, max: number) =>
  text()
    .min(1, 'is required')
    .transform(Number)
    .pipe(
      z
        .number({ error: 'must be a number' })
        .min(min, `must be at least ${min}`)
        .max(max, `must be at most ${max}`)
    );

export const MAX_SEARCH_LIMIT = 50;
export const DEFAULT_SEARCH_LIMIT = 20;

export const searchQuerySchema = z.object({
  q: text()
    .trim()
    .min(2, 'must be at least 2 characters')
    .max(100, 'must be at most 100 characters')
    .optional(),
  type: z
    .enum(LOCATION_LEVELS, {
      error: `must be one of: ${LOCATION_LEVELS.join(', ')}`,
    })
    .optional(),
  region: text().trim().min(1, 'must not be empty').max(50).optional(),
  limit: wholeNumber(1, MAX_SEARCH_LIMIT).default(DEFAULT_SEARCH_LIMIT),
});

export const nearestQuerySchema = z.object({
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
});

export const locationParamsSchema = z.object({
  locationId: text()
    .regex(/^[1-9]\d{0,14}$/, 'must be a positive whole number')
    .transform(Number),
});
