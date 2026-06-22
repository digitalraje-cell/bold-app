'use client';

import dynamic from 'next/dynamic';

export const PwaUpdateManagerClient = dynamic(
  () => import('@/components/pwa/PwaUpdateManager').then((mod) => mod.PwaUpdateManager),
  { ssr: false },
);
