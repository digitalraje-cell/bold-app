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
  const apiRef = useRef(api);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const sharingActive = isMobileScreenShareStageActive(context);
  const shouldApply = isMobile && sharingActive && api.mediaReady;

  useEffect(() => {
    const currentApi = apiRef.current;

    if (!shouldApply) {
      if (appliedRef.current) {
        restoreMobileScreenShareLayout(currentApi);
        appliedRef.current = false;
      }
      return;
    }

    applyMobileScreenShareLayout(currentApi, context);
    appliedRef.current = true;

    return () => {
      if (appliedRef.current) {
        restoreMobileScreenShareLayout(apiRef.current);
        appliedRef.current = false;
      }
    };
  }, [
    shouldApply,
    context.isScreenSharing,
    context.isPresenterLayout,
    context.contentSharingParticipantIds.join(','),
    context.roomMode,
    api.mediaReady,
  ]);

  const shellClassName = useMemo(
    () => (isMobile && sharingActive ? mobileScreenShareShellClass(true) : ''),
    [isMobile, sharingActive],
  );

  return { shellClassName, isMobileScreenShareActive: isMobile && sharingActive };
}
