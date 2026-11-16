import { formatAnomaly, formatMetric } from '../src/features/home/format';

describe('formatMetric', () => {
  it('formats the value with its unit and digits', () => {
    expect(formatMetric(27.44, 1, '°C')).toBe('27.4 °C');
    expect(formatMetric(812, 0, 'mm')).toBe('812 mm');
  });

  it('attaches percent without a space', () => {
    expect(formatMetric(62, 0, '%')).toBe('62%');
  });

  it('returns Unavailable instead of zero for missing values', () => {
    expect(formatMetric(null, 1, '°C')).toBe('Unavailable');
  });
});

describe('formatAnomaly', () => {
  it('signs positive anomalies', () => {
    expect(formatAnomaly(1.2)).toBe('+1.2 °C');
  });

  it('keeps negative anomalies unsigned', () => {
    expect(formatAnomaly(-0.5)).toBe('-0.5 °C');
  });

  it('returns Unavailable for missing values', () => {
    expect(formatAnomaly(null)).toBe('Unavailable');
  });
});
