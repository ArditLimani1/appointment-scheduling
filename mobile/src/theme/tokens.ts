/**
 * Design tokens ported from the web app.
 *
 * The colour ramp is Material 3, copied 1:1 from the root `tailwind.config.js`.
 * Everything below it — fonts, radii, weights, elevation, and the component
 * recipes in `components/ui.tsx` — is taken from how the Inertia pages actually
 * use that ramp, not from Material defaults. Two habits matter most:
 *
 *   1. The primary action is **`onSurface` (near-black)**, not `primary`. The
 *      web's action buttons are `bg-on-surface text-surface`; `primary` (#006398)
 *      is a tint colour, not a button colour.
 *   2. Panels are **ringed, not bordered**: `rounded-2xl ring-1 ring-slate-100
 *      shadow-sm` over `surfaceContainerLowest`.
 */
export const palette = {
  primary: '#006398',
  onPrimary: '#ffffff',
  primaryContainer: '#001d31',
  onPrimaryContainer: '#188ace',
  primaryFixed: '#cce5ff',
  onPrimaryFixed: '#001d31',
  onPrimaryFixedVariant: '#004b73',
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
  onTertiaryFixed: '#002113',
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

  /** Tailwind slate, used by the web for hairlines and rings on panels. */
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',

  /** Tailwind red, used by the web's soft destructive buttons. */
  red50: '#fef2f2',
  red200: '#fecaca',
  red950: '#450a0a',
} as const;

/** Translucent hairlines — the web writes these as `outline-variant/25..40`. */
export const hairline = {
  faint: 'rgba(198, 198, 205, 0.25)',
  soft: 'rgba(198, 198, 205, 0.35)',
  medium: 'rgba(198, 198, 205, 0.4)',
} as const;

/**
 * Status colours from `Components/AppointmentStatusMenu.jsx`. Pending is neutral
 * grey and confirmed is the bright tertiary green — not the amber/blue pair a
 * generic Material palette would suggest.
 */
export const statusColors = {
  pending: {
    bg: palette.surfaceContainerHighest,
    fg: palette.onSurfaceVariant,
    dot: palette.outline,
    ring: 'rgba(198, 198, 205, 0.7)',
  },
  confirmed: {
    bg: palette.tertiaryFixed,
    fg: palette.onTertiaryFixed,
    dot: palette.onTertiaryFixed,
    ring: 'rgba(0, 33, 19, 0.2)',
  },
  cancelled: {
    bg: palette.errorContainer,
    fg: palette.onErrorContainer,
    dot: palette.error,
    ring: 'rgba(186, 26, 26, 0.2)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Named exactly like the web's `borderRadius` scale so classes port directly. */
export const radius = {
  DEFAULT: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

/** Manrope for headings, Inter for everything else — as in `tailwind.config.js`. */
export const fonts = {
  headline: 'Manrope_800ExtraBold',
  headlineBold: 'Manrope_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/**
 * Type scale. Headings use Manrope with the web's `tracking-tight`; the small
 * uppercase `overline` is the web's `text-[10px] font-bold uppercase
 * tracking-widest text-outline`, which it uses for nearly every field label.
 */
export const typography = {
  displaySmall: { fontFamily: fonts.headline, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  headline: { fontFamily: fonts.headline, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  title: { fontFamily: fonts.headlineBold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  /** Numeric emphasis inside cards — the web's `font-headline font-extrabold`. */
  numeric: { fontFamily: fonts.headline, fontSize: 16, lineHeight: 20, letterSpacing: -0.2 },

  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  labelStrong: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 15 },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
} as const;

/** `shadow-sm` / `shadow-md` from Tailwind, expressed for both platforms. */
export const elevation = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;
