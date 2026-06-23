'use client';

import { useEffect, useMemo, useRef } from 'react';
import { RoomMode } from '@boldmeet/shared';
import {
  applyAutoStageLayout,
  meetingStageShellClass,
  type MeetingStageContext,
  type MeetingStageJitsiApi,
} from '@/lib/meeting-stage-layout';

export function useAutoStageLayout(
  api: MeetingStageJitsiApi,
  context: MeetingStageContext,
) {
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    applyAutoStageLayout(apiRef.current, context);
  }, [
    context.isScreenSharing,
    context.isPresenterLayout,
    context.roomMode,
    context.isYoutubeLiveCapturing,
    api.mediaReady,
  ]);

  const shellClassName = useMemo(() => meetingStageShellClass(context), [context]);

  return { shellClassName };
}

export type { MeetingStageContext };
