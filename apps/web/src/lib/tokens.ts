/**
 * BoldMeet V3 Design Tokens
 * Nixtio-inspired: warm cream, soft UI, pill CTAs, monochrome.
 */
export const tokens = {
  color: {
    background: '#FAF8F5',
    card: '#FFFFFF',
    textPrimary: '#111111',
    textSecondary: '#6B7280',
    border: '#ECEAE6',
    badgeBg: '#F4F3F0',
    ctaBg: '#111111',
    ctaText: '#FFFFFF',
    ctaHover: '#2A2A2A',
  },
  radius: {
    sm: '12px',
    md: '20px',
    lg: '28px',
    xl: '40px',
    pill: '9999px',
  },
  font: {
    family: 'var(--font-inter), system-ui, sans-serif',
    weight: {
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const;

export type DesignTokens = typeof tokens;
