/**
 * Material Design 3 tokens, ported 1:1 from the web app's tailwind.config.js
 * so the mobile app and the admin web share one visual language.
 */
export const palette = {
  primary: '#006398',
  onPrimary: '#ffffff',
  primaryContainer: '#001d31',
  onPrimaryContainer: '#188ace',
  primaryFixed: '#cce5ff',
  primaryFixedDim: '#93ccff',
  inversePrimary: '#93ccff',

  secondaryContainer: '#d5e3fd',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#57657b',
  secondaryFixed: '#d5e3fd',
  secondaryFixedDim: '#b9c7e0',

  tertiaryContainer: '#002113',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#009668',
  tertiaryFixed: '#6ffbbe',
  tertiaryFixedDim: '#4edea3',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  surface: '#f7f9fb',
  surfaceDim: '#d8dadc',
  surfaceBright: '#f7f9fb',
  surfaceVariant: '#e0e3e5',
  surfaceTint: '#006398',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',

  onSurface: '#191c1e',
  onSurfaceVariant: '#45464d',
  onBackground: '#191c1e',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',

  inverseSurface: '#2d3133',
  inverseOnSurface: '#eff1f3',
} as const;

export const statusColors = {
  pending: { bg: '#fff3cd', fg: '#8a6d00', dot: '#e0a800' },
  confirmed: { bg: '#d5e3fd', fg: '#1b4d8f', dot: '#2f6fce' },
  cancelled: { bg: palette.errorContainer, fg: palette.onErrorContainer, dot: palette.error },
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const typography = {
  displaySmall: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  headline: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
} as const;
