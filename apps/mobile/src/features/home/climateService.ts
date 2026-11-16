import { sampleHomeClimate } from './sampleClimate';
import type { HomeClimate } from './types';

// Returns sample data until the API is connected in Week 3 (W3D4).
export function fetchHomeClimate(): Promise<HomeClimate> {
  return Promise.resolve(sampleHomeClimate);
}
