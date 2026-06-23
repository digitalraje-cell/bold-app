'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RoomMode } from '@boldmeet/shared';
import {
  attendeeShellClassName,
  resolveEffectiveLayout,
  type LayoutContext,
} from '@/lib/attendee-layout-context';
import { applyAttendeeLayoutToJitsi, type AttendeeJitsiLayoutApi } from '@/lib/attendee-layout-jitsi';
import {
  type AttendeeLayoutPrefs,
  type DockPosition,
  type DockViewMode,
  type SelfViewCorner,
  type SelfViewMode,
  type StageLayout,
  readAttendeeLayoutPrefs,
  writeAttendeeLayoutPrefs,
} from '@/lib/attendee-layout-prefs';

export function useAttendeeLayout(
  api: AttendeeJitsiLayoutApi,
  context: LayoutContext,
) {
  const [prefs, setPrefs] = useState<AttendeeLayoutPrefs>(() => readAttendeeLayoutPrefs());
  const apiRef = useRef(api);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const effectivePrefs = useMemo(
    () => resolveEffectiveLayout(prefs, context),
    [prefs, context],
  );

  const updatePrefs = useCallback((patch: Partial<AttendeeLayoutPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch, version: 2 as const };
      writeAttendeeLayoutPrefs(next);
      return next;
    });
  }, []);

  const setStageLayout = useCallback(
    (stageLayout: StageLayout) => updatePrefs({ stageLayout }),
    [updatePrefs],
  );

  const setDockPosition = useCallback(
    (dockPosition: DockPosition) => updatePrefs({ dockPosition, dockCollapsed: false }),
    [updatePrefs],
  );

  const toggleDockCollapsed = useCallback(() => {
    updatePrefs({ dockCollapsed: !prefs.dockCollapsed });
  }, [prefs.dockCollapsed, updatePrefs]);

  const setDockViewMode = useCallback(
    (dockViewMode: DockViewMode) => updatePrefs({ dockViewMode }),
    [updatePrefs],
  );

  const setSelfViewMode = useCallback(
    (selfViewMode: SelfViewMode) => updatePrefs({ selfViewMode }),
    [updatePrefs],
  );

  const setSelfViewCorner = useCallback(
    (selfViewCorner: SelfViewCorner) => updatePrefs({ selfViewCorner }),
    [updatePrefs],
  );

  const patchSelfViewFloating = useCallback(
    (patch: Partial<AttendeeLayoutPrefs['selfViewFloating']>) => {
      updatePrefs({ selfViewFloating: { ...prefs.selfViewFloating, ...patch } });
    },
    [prefs.selfViewFloating, updatePrefs],
  );

  useEffect(() => {
    applyAttendeeLayoutToJitsi(apiRef.current, effectivePrefs);
  }, [effectivePrefs, api.mediaReady, api.pinnedParticipantId]);

  const shellClassName = useMemo(
    () => attendeeShellClassName(effectivePrefs),
    [effectivePrefs],
  );

  const dockVisible = effectivePrefs.dockPosition !== 'hidden';

  return {
    prefs,
    effectivePrefs,
    updatePrefs,
    setStageLayout,
    setDockPosition,
    toggleDockCollapsed,
    setDockViewMode,
    setSelfViewMode,
    setSelfViewCorner,
    patchSelfViewFloating,
    shellClassName,
    dockVisible,
    isWebinar: context.roomMode === RoomMode.WEBINAR,
    isScreenShareContext: context.isScreenSharing || context.isPresenterLayout,
  };
}

export { mergeJitsiRoster } from '@/hooks/useMeetingLayout';
