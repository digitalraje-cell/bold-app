'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface DurationResponse {
  active: boolean;
  expired?: boolean;
  unlimited?: boolean;
  warning?: boolean;
  reason?: string;
  message?: string;
  status?: {
    elapsedMinutes: number;
    limitMinutes: number | null;
    gracePeriodMinutes: number;
    isExpired: boolean;
    isInGracePeriod: boolean;
    remainingMinutes: number | null;
  };
}

export function useMeetingDuration(meetingId: string, onExpired: () => void) {
  const [durationState, setDurationState] = useState<DurationResponse | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showGraceWarning, setShowGraceWarning] = useState(false);

  const checkDuration = useCallback(async () => {
    try {
      const data = (await api.meetings.getDuration(meetingId)) as DurationResponse;
      setDurationState(data);

      if (data.expired) {
        setShowExpiredModal(true);
        onExpired();
      } else if (data.warning) {
        setShowGraceWarning(true);
      }
    } catch {
      // silently ignore polling errors
    }
  }, [meetingId, onExpired]);

  useEffect(() => {
    checkDuration();
    const interval = setInterval(checkDuration, 30000);
    return () => clearInterval(interval);
  }, [checkDuration]);

  return {
    durationState,
    showExpiredModal,
    showGraceWarning,
    dismissExpiredModal: () => setShowExpiredModal(false),
    dismissGraceWarning: () => setShowGraceWarning(false),
  };
}
