import type { Metadata } from 'next';
import { LEGAL_CONFIG } from './legal-config';
import { getServerAppOrigin } from './urls';

export function createLegalMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const siteName = LEGAL_CONFIG.productName;
  const fullTitle = `${title} | ${siteName}`;
  const origin = getServerAppOrigin();
  const url = `${origin}${path}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
    },
  };
}
