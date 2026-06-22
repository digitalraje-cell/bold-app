import { buildNestApiUrl } from '@/lib/api-base';

export type PlatformStats = {
  meetingsHosted: number;
  registeredUsers: number;
  countriesReached: number | null;
  hoursConnected: number;
};

export async function fetchPlatformStatsServer(): Promise<PlatformStats | null> {
  try {
    const res = await fetch(buildNestApiUrl('/public/platform-stats'), {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as PlatformStats;
  } catch {
    return null;
  }
}

export function formatStatValue(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 10_000) return `${Math.floor(value / 1_000)}K+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
  return value.toLocaleString();
}

export function formatHoursConnected(hours: number | null | undefined): string {
  if (hours == null) return '—';
  if (hours >= 1_000_000) return `${(hours / 1_000_000).toFixed(1)}M+`;
  if (hours >= 10_000) return `${Math.floor(hours / 1_000)}K+`;
  return hours.toLocaleString();
}
