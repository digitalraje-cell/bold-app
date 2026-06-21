'use client';

import { useEffect } from 'react';
import { initUserSettingsTheme } from '@/lib/user-settings';

export function UserSettingsInit() {
  useEffect(() => {
    initUserSettingsTheme();
  }, []);

  return null;
}
