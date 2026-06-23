'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyMobileScreenShareLayout,
  isMobileScreenShareStageActive,
  mobileScreenShareShellClass,
  restoreMobileScreenShareLayout,
  type MobileScreenShareContext,
  type MobileScreenShareJitsiApi,
} from '@/lib/media/mobile-screen-share-layout';

function useIsMobileMeetingViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function useMobileScreenShareLayout(
  api: MobileScreenShareJitsiApi,
  context: MobileScreenShareContext,
) {
  const isMobile = useIsMobileMeetingViewport();
  const appliedRef = useRef(false);
  const prevShouldApplyRef = useRef(false);
  const apiRef = useRef(api);
  const contextRef = useRef(context);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const sharingActive = isMobileScreenShareStageActive(context);
  const shouldApply = isMobile && sharingActive && api.mediaReady;

  // Transition-based layout: apply once on OFF→ON, restore once on ON→OFF.
  useEffect(() => {
    const wasActive = prevShouldApplyRef.current;
    const isActive = shouldApply;
    prevShouldApplyRef.current = isActive;

    if (!wasActive && isActive) {
      applyMobileScreenShareLayout(apiRef.current, contextRef.current);
      appliedRef.current = true;
      return;
    }

    if (wasActive && !isActive && appliedRef.current) {
      restoreMobileScreenShareLayout(apiRef.current);
      appliedRef.current = false;
    }
  }, [shouldApply]);

  // Unmount / leave meeting — ensure Jitsi config is restored.
  useEffect(() => {
    return () => {
      if (appliedRef.current) {
        restoreMobileScreenShareLayout(apiRef.current);
        appliedRef.current = false;
        prevShouldApplyRef.current = false;
      }
    };
  }, []);

  const shellClassName = useMemo(
    () => (isMobile && sharingActive ? mobileScreenShareShellClass(true) : ''),
    [isMobile, sharingActive],
  );

  return { shellClassName, isMobileScreenShareActive: isMobile && sharingActive };
}
