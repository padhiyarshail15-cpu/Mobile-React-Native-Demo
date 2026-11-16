export const colors = {
  primary: '#0B6B4F',
  secondary: '#14B8A6',
  accent: '#3B82F6',
  surface: '#E8F7F1',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#B91C1C',
  temperature: '#F97316',
  precipitation: '#3B82F6',
  solar: '#F59E0B',
  humidity: '#14B8A6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, lineHeight: 28, fontWeight: '600' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

export type TypographyVariant = keyof typeof typography;
