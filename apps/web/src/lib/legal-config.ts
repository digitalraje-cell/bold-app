/**
 * Legal and compliance constants for Bold SaaS.
 * Override via env for staging; production defaults match Razorpay verification requirements.
 */
import { SUPPORT_EMAIL } from '@/lib/constants/support';

export const LEGAL_CONFIG = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Lifetop Academy',
  productName: process.env.NEXT_PUBLIC_APP_NAME || 'Bold',
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'bold.robozant.com',
  websiteUrl:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://bold.robozant.com',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || SUPPORT_EMAIL,
  responseTime: 'Within 48 business hours',
  governingLaw: 'India',
} as const;
