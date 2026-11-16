import type { HomeClimate } from './types';

export const sampleHomeClimate: HomeClimate = {
  isSample: true,
  location: { name: 'Ahmedabad', country: 'IN' },
  currentYear: 2026,
  baseline: '1991–2020',
  annualMeanTempC: 27.4,
  anomalyC: 1.2,
  humidityPct: 62,
  annualRainMm: 812,
  solarKwhM2Day: 5.6,
  insight:
    'Sample insight: temperatures are above the 1991–2020 baseline. Live insight text arrives with the API in Week 3.',
  source: {
    name: 'NASA POWER',
    dataType: 'Reanalysis',
    resolutionKm: 50,
  },
};
