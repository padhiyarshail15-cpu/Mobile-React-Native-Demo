export type ClimateSource = {
  name: string;
  dataType: 'Reanalysis';
  resolutionKm: number;
};

export type HomeClimate = {
  isSample: boolean;
  location: { name: string; country: string };
  currentYear: number;
  baseline: string;
  annualMeanTempC: number | null;
  anomalyC: number | null;
  humidityPct: number | null;
  annualRainMm: number | null;
  solarKwhM2Day: number | null;
  insight: string | null;
  source: ClimateSource;
};

export type HomeClimateState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: HomeClimate };
