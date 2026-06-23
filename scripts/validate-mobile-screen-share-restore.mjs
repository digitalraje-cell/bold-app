#!/usr/bin/env node
/**
 * Validates mobile screen-share apply/restore cycles (no browser / Jitsi required).
 */
import {
  applyMobileScreenShareLayout,
  isMobileScreenShareStageActive,
  restoreMobileScreenShareLayout,
} from '../apps/web/src/lib/media/mobile-screen-share-layout.ts';

function createMockApi() {
  const calls = [];
  const api = {
    mediaReady: true,
    setTileView: (v) => calls.push(['setTileView', v]),
    setFilmstripVisible: (v) => calls.push(['setFilmstripVisible', v]),
    setSelfViewHidden: (v) => calls.push(['setSelfViewHidden', v]),
    overwriteConfig: (c) => calls.push(['overwriteConfig', { ...c }]),
  };
  return { api, calls };
}

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
}

// Share detection
record(
  'Detects local screen share',
  isMobileScreenShareStageActive({ isScreenSharing: true, isPresenterLayout: false, contentSharingParticipantIds: [], roomMode: 'MEETING' }),
);
record(
  'Webinar without share stays inactive',
  !isMobileScreenShareStageActive({ isScreenSharing: false, isPresenterLayout: true, contentSharingParticipantIds: [], roomMode: 'WEBINAR' }),
);
record(
  'Webinar with remote share stays active',
  isMobileScreenShareStageActive({ isScreenSharing: false, isPresenterLayout: false, contentSharingParticipantIds: ['p1'], roomMode: 'WEBINAR' }),
);

// Apply presenter path
{
  const { api, calls } = createMockApi();
  applyMobileScreenShareLayout(api, {
    isScreenSharing: true,
    isPresenterLayout: true,
    contentSharingParticipantIds: [],
    roomMode: 'MEETING',
  });
  const overwrite = calls.find((c) => c[0] === 'overwriteConfig')?.[1];
  record('Presenter: disableSelfView false', overwrite?.disableSelfView === false);
  record('Presenter: filmstrip hidden', calls.some((c) => c[0] === 'setFilmstripVisible' && c[1] === false));
  record('Presenter: self-view shown', calls.some((c) => c[0] === 'setSelfViewHidden' && c[1] === false));
}

// Apply viewer path
{
  const { api, calls } = createMockApi();
  applyMobileScreenShareLayout(api, {
    isScreenSharing: false,
    isPresenterLayout: true,
    contentSharingParticipantIds: ['remote'],
    roomMode: 'MEETING',
  });
  const overwrite = calls.find((c) => c[0] === 'overwriteConfig')?.[1];
  record('Viewer: disableSelfView true', overwrite?.disableSelfView === true);
}

// Restore clears overwriteConfig
{
  const { api, calls } = createMockApi();
  applyMobileScreenShareLayout(api, {
    isScreenSharing: true,
    isPresenterLayout: true,
    contentSharingParticipantIds: [],
    roomMode: 'MEETING',
  });
  calls.length = 0;
  restoreMobileScreenShareLayout(api);
  const overwrite = calls.find((c) => c[0] === 'overwriteConfig')?.[1];
  record('Restore: filmstrip re-enabled', overwrite?.disableStageFilmstrip === false);
  record('Restore: disableSelfViewSettings cleared', overwrite?.disableSelfViewSettings === false);
  record('Restore: setTileView true', calls.some((c) => c[0] === 'setTileView' && c[1] === true));
  record('Restore: filmstrip visible', calls.some((c) => c[0] === 'setFilmstripVisible' && c[1] === true));
}

// Multi-cycle
{
  const { api } = createMockApi();
  for (let i = 0; i < 3; i += 1) {
    applyMobileScreenShareLayout(api, {
      isScreenSharing: i % 2 === 0,
      isPresenterLayout: true,
      contentSharingParticipantIds: i % 2 === 0 ? [] : ['x'],
      roomMode: 'MEETING',
    });
    restoreMobileScreenShareLayout(api);
  }
  record('Multi-cycle apply/restore', true);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
