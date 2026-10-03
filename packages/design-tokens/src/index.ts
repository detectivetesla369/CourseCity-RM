/**
 * CourseCity 1.0 — Authoritative Design Tokens
 */

export const colors = {
  // CourseCity Orange Spectrum
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // BRAND SIGNATURE
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    bright: '#FF7A00',
  },

  // Warm Neutrals (Espresso & Cream)
  neutral: {
    white: '#FFFFFF',
    canvas: '#FFFCF8',
    ivory: '#FFF9F4',
    border: '#EDE3DA',
    muted: '#766B61',
    body: '#453B33',
    primary: '#17130F',
  },

  // Semantic Pastels
  pastel: {
    success: '#DDF3E7',
    warning: '#FFF0B8',
    accent: '#EEE7FF',
    warm: '#FFE2CC',
    light: '#FFD5B5',
  },
} as const;

export const typography = {
  fontFamily: {
    display: ['"Plus Jakarta Sans"', 'Manrope', 'sans-serif'],
    body: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.6rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.15' }],
  },
} as const;

export const radii = {
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const shadows = {
  subtle: '0 1px 2px 0 rgba(23, 19, 15, 0.05)',
  card: '0 4px 12px -2px rgba(23, 19, 15, 0.06), 0 2px 6px -1px rgba(23, 19, 15, 0.03)',
  cardHover: '0 12px 24px -4px rgba(249, 115, 22, 0.12), 0 4px 12px -2px rgba(23, 19, 15, 0.04)',
  elevated: '0 20px 32px -8px rgba(23, 19, 15, 0.10)',
} as const;
