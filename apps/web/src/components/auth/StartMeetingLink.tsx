'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { ComponentProps } from 'react';
import { START_MEETING_AUTH_HREF, START_MEETING_LOGIN_HREF } from '@/lib/auth-routes';

type StartMeetingLinkProps = Omit<ComponentProps<typeof Link>, 'href'>;

/**
 * Meeting-first CTA: guests sign in (return to instant create), hosts start instantly.
 */
export function StartMeetingLink(props: StartMeetingLinkProps) {
  const { status } = useSession();
  const href = status === 'authenticated' ? START_MEETING_AUTH_HREF : START_MEETING_LOGIN_HREF;

  return <Link href={href} {...props} />;
}
