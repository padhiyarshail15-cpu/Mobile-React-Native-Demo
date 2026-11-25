import { readFileSync } from 'node:fs';
import path from 'node:path';

// These tests describe how NASA POWER behaves, using real saved responses (see fixtures/README.md).
// They are the checked version of docs/climatelens/NASA_POWER_SPIKE.md.

interface PowerResponse {
  geometry: { type: string; coordinates: [number, number, number] };
  properties: { parameter: Record<string, Record<string, number>> };
  header: {
    api: { version: string };
    sources: string[];
    fill_value: number;
    start: string;
    end: string;
  };
  parameters: Record<string, { units: string; longname: string }>;
}

const load = <T = PowerResponse>(name: string): T =>
  JSON.parse(readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')) as T;

const FILL = -999;
const isLeap = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const daysIn = (year: number, month: number) =>
  new Date(year, month, 0).getDate();
const monthKeys = (year: number) =>
  Array.from(
    { length: 12 },
    (_, i) => `${year}${String(i + 1).padStart(2, '0')}`
  );
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const full = load('monthly-ahmedabad-1981-2025.json');
const series = full.properties.parameter;

describe('NASA POWER monthly response (Ahmedabad, 1981-2025)', () => {
  it('returns every requested parameter with its unit', () => {
    expect(
      Object.fromEntries(
        Object.entries(full.parameters).map(([name, p]) => [name, p.units])
      )
    ).toEqual({
      T2M: 'C',
      PRECTOTCORR: 'mm/day',
      RH2M: '%',
      WS10M: 'm/s',
      ALLSKY_SFC_SW_DWN: 'kW-hr/m^2/day',
    });
  });

  it('declares -999 as the fill value and lists its sources', () => {
    expect(full.header.fill_value).toBe(FILL);
    expect(full.header.sources).toEqual(
      expect.arrayContaining(['MERRA2', 'SRB', 'SYN1DEG'])
    );
    expect(full.header.start).toBe('19810101');
  });

  it('puts longitude first in the geometry, then latitude, then the cell elevation', () => {
    expect(full.geometry.coordinates).toEqual([72.58, 23.03, 46.53]);
  });

  it('keys values as YYYYMM, with a 13th "month" for each year', () => {
    for (const values of Object.values(series)) {
      const keys = Object.keys(values);
      expect(keys).toHaveLength(45 * 13);
      expect(keys.every(key => /^\d{4}(0[1-9]|1[0-3])$/.test(key))).toBe(true);
    }
  });
});

describe('the 13th key is the annual value', () => {
  it('equals the mean of the twelve months for temperature, every year', () => {
    for (const year of range(1981, 2025)) {
      const months = monthKeys(year).map(key => series.T2M[key]);
      const mean = months.reduce((a, b) => a + b, 0) / 12;
      expect(Math.abs(series.T2M[`${year}13`] - mean)).toBeLessThan(0.06);
    }
  });

  it('is a daily average for precipitation (mm/day), so a yearly total needs the days', () => {
    for (const year of range(1981, 2025)) {
      const fromMonths = monthKeys(year).reduce(
        (sum, key, i) => sum + series.PRECTOTCORR[key] * daysIn(year, i + 1),
        0
      );
      const fromAnnual =
        series.PRECTOTCORR[`${year}13`] * (isLeap(year) ? 366 : 365);
      expect(Math.abs(fromAnnual - fromMonths) / fromMonths).toBeLessThan(0.01);
    }
  });
});

describe('missing data is -999, never null or 0', () => {
  it('has no solar data before 1984, and nothing else is missing', () => {
    const solar = series.ALLSKY_SFC_SW_DWN;
    const missingYears = new Set(
      Object.entries(solar)
        .filter(([, value]) => value === FILL)
        .map(([key]) => key.slice(0, 4))
    );

    expect([...missingYears].sort()).toEqual(['1981', '1982', '1983']);
    for (const name of ['T2M', 'PRECTOTCORR', 'RH2M', 'WS10M']) {
      expect(Object.values(series[name]).includes(FILL)).toBe(false);
    }
  });

  it('covers the whole 1991-2020 baseline for every variable', () => {
    for (const values of Object.values(series)) {
      for (const year of range(1991, 2020)) {
        for (const key of monthKeys(year)) {
          expect(values[key]).not.toBe(FILL);
          expect(typeof values[key]).toBe('number');
        }
      }
    }
  });

  it('can have a real zero, which is not the same as missing', () => {
    expect(series.PRECTOTCORR['202001']).toBe(0);
  });
});

describe('the current year is only partly available', () => {
  const partial = load('monthly-ahmedabad-2025-2026-partial.json');
  const { T2M, ALLSKY_SFC_SW_DWN: solar } = partial.properties.parameter;

  it('has an annual key for the finished year but not the unfinished one', () => {
    expect(T2M['202513']).toBeDefined();
    expect(T2M['202613']).toBeUndefined();
    expect(solar['202613']).toBeUndefined();
  });

  it('fills the months that are not available yet, and solar lags temperature', () => {
    expect(T2M['202609']).not.toBe(FILL);
    expect(T2M['202610']).toBe(FILL);
    expect(solar['202607']).not.toBe(FILL);
    expect(solar['202608']).toBe(FILL);
  });
});

describe('southern hemisphere and error shapes', () => {
  it('keeps a negative latitude as sent', () => {
    const sydney = load('monthly-sydney-2020-2024.json');

    expect(sydney.geometry.coordinates.slice(0, 2)).toEqual([151.21, -33.87]);
  });

  it('reports a request error as HTTP 422 with a text header and a list of messages', () => {
    const error = load<{ header: string; messages: string[] }>(
      'error-422-end-date-out-of-range.json'
    );

    expect(typeof error.header).toBe('string');
    expect(error.messages[0]).toMatch(/end date out of range/i);
  });
});
