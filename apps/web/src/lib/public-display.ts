import { LEGAL_CONFIG } from './legal-config';

const PRODUCTION_DOMAIN = 'bold.robozant.com';
const PRODUCTION_URL = `https://${PRODUCTION_DOMAIN}`;

function isLocalHost(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

/** Public-facing URL — never show localhost in marketing/legal UI */
export function getPublicDisplayUrl(): string {
  const url = LEGAL_CONFIG.websiteUrl;
  if (isLocalHost(url)) {
    return PRODUCTION_URL;
  }
  return url;
}

export function getPublicDisplayDomain(): string {
  const domain = LEGAL_CONFIG.domain;
  if (isLocalHost(domain)) {
    return PRODUCTION_DOMAIN;
  }
  return domain;
}
