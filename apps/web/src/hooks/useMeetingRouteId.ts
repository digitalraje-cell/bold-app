'use client';

import { useParams } from 'next/navigation';

export function useMeetingRouteId(): string | null {
  const params = useParams<{ meetingId?: string | string[] }>();
  const value = params.meetingId;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}
