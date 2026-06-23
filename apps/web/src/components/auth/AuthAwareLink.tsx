'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { ComponentProps } from 'react';
import { AUTHENTICATED_HOME, resolveAuthAwareHref } from '@/lib/auth-routes';

type AuthAwareLinkProps = ComponentProps<typeof Link> & {
  /** Where authenticated users go when this link targets a guest auth route. */
  authHref?: string;
};

/**
 * Link that sends authenticated users to the dashboard (or authHref) instead of login/signup.
 */
export function AuthAwareLink({
  href,
  authHref = AUTHENTICATED_HOME,
  ...props
}: AuthAwareLinkProps) {
  const { status } = useSession();
  const hrefString = typeof href === 'string' ? href : (href.pathname ?? '/login');
  const destination =
    status === 'authenticated'
      ? resolveAuthAwareHref(hrefString, true, authHref)
      : hrefString;

  return <Link href={destination} {...props} />;
}
