/**
 * Arambh Clinic design tokens.
 * Palette verified against the web app's globals.css so both platforms match.
 */
export const colors = {
    // Primary — sage green
    primary50: '#f4f6f3',
    primary100: '#e5eae2',
    primary200: '#ccd6c7',
    primary300: '#a8b9a0',
    primary400: '#839a79',
    primary500: '#5d7052',
    primary600: '#4a5a41',
    primary700: '#3d4937',
    primary800: '#333c2f',
    primary900: '#2b3228',

    // Secondary — muted teal-green
    secondary500: '#6b8e70',
    secondary600: '#567a5c',
    secondary700: '#46634b',

    // Warm neutrals (cream)
    warm50: '#fdfcfa',
    warm100: '#f5f0e8',
    warm200: '#ebe4d6',

    // Neutral grays
    neutral50: '#fafafa',
    neutral100: '#f5f5f5',
    neutral200: '#e5e5e5',
    neutral300: '#d4d4d4',
    neutral400: '#a3a3a3',
    neutral500: '#737373',
    neutral600: '#525252',
    neutral700: '#404040',
    neutral800: '#262626',
    neutral900: '#171717',

    // Semantic
    white: '#ffffff',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
} as const;

export const fonts = {
    /** Serif display font for headings — matches web's Playfair Display */
    serif: 'PlayfairDisplay_600SemiBold',
    serifBold: 'PlayfairDisplay_700Bold',
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
    xl: 24,
    full: 9999,
} as const;
