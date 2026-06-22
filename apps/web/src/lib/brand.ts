/**
 * Bold brand identity — colors, typography, and asset paths.
 * Concept A "Bold Beacon" (B monogram + live indicator) is the primary mark.
 */
export const BRAND = {
  name: 'Bold',
  tagline: 'Meet Better',
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#3B82F6',
    navy: '#0F172A',
    navyDeep: '#1E3A8A',
    accent: '#93C5FD',
    success: '#059669',
    successLight: '#10B981',
    error: '#DC2626',
    errorLight: '#EF4444',
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      400: '#94A3B8',
      500: '#64748B',
      700: '#334155',
      900: '#0F172A',
    },
  },
  assets: {
    logo: '/brand/logo.svg',
    logoDark: '/brand/logo-dark.svg',
    logoIcon: '/brand/logo-icon.svg',
    favicon: '/brand/favicon.svg',
    appleTouchIcon: '/brand/apple-touch-icon.svg',
    ogImage: '/brand/og-image.svg',
    concepts: {
      beacon: '/brand/concepts/concept-a-beacon.svg',
      network: '/brand/concepts/concept-b-network.svg',
      dialog: '/brand/concepts/concept-c-dialog.svg',
    },
  },
} as const;

export type BoldLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BoldLogoVariant = 'full' | 'icon';
export type BoldLogoTheme = 'light' | 'dark' | 'auto';

export const LOGO_ICON_SIZES: Record<BoldLogoSize, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export const LOGO_WORDMARK_SIZES: Record<BoldLogoSize, string> = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};
