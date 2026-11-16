export const UNAVAILABLE_LABEL = 'Unavailable';

export function formatMetric(
  value: number | null,
  fractionDigits: number,
  unit: string
): string {
  if (value === null) {
    return UNAVAILABLE_LABEL;
  }
  return `${value.toFixed(fractionDigits)}${unit === '%' ? '' : ' '}${unit}`;
}

export function formatAnomaly(value: number | null): string {
  if (value === null) {
    return UNAVAILABLE_LABEL;
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} °C`;
}
