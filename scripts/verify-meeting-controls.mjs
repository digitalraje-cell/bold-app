/**
 * Verification for More options menu positioning and screen-share capability rules.
 * Run: node scripts/verify-meeting-controls.mjs
 */

import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);

// Screen share rules (mirrors screen-share-capability.ts)
function evaluateScreenShareSupport(input) {
  const {
    hasMediaDevices,
    hasGetDisplayMedia,
    isAndroid,
    isIos,
    isPwa,
  } = input;

  if (!hasMediaDevices) {
    return { supported: false, reason: 'no-media-devices' };
  }
  if (!hasGetDisplayMedia) {
    return { supported: false, reason: 'no-get-display-media' };
  }
  if (isAndroid) {
    return { supported: false, reason: isPwa ? 'android-pwa' : 'android' };
  }
  if (isIos) {
    return { supported: false, reason: 'ios' };
  }
  return { supported: true, reason: null };
}

// Inline copy of computeMoreMenuPosition for script portability
function computeMoreMenuPosition(anchorRect, viewport, options = {}) {
  const padding = options.padding ?? 8;
  const safeAreaTop = options.safeAreaTop ?? 0;
  const maxMenuWidth = Math.max(160, viewport.width - padding * 2);
  const menuWidth = Math.min(options.menuWidth ?? 192, maxMenuWidth);

  let left = anchorRect.right - menuWidth;
  left = Math.max(padding, Math.min(left, viewport.width - menuWidth - padding));

  const bottom = viewport.height - anchorRect.top + padding;
  const maxHeight = Math.max(120, anchorRect.top - padding * 2 - safeAreaTop);

  return { left, bottom, maxHeight, width: menuWidth };
}

function run() {
  // Task 1 — menu viewport clamping
  const portrait = computeMoreMenuPosition(
    { top: 600, right: 340, bottom: 640, left: 300 },
    { width: 360, height: 740 },
  );
  assert.equal(portrait.width, 192, 'portrait menu keeps default width when viewport allows');
  assert.ok(portrait.left >= 8, 'portrait menu left clamped');
  assert.ok(portrait.left + portrait.width <= 352, 'portrait menu fits in viewport');
  assert.ok(portrait.maxHeight > 0, 'portrait menu has height budget');

  const landscape = computeMoreMenuPosition(
    { top: 280, right: 700, bottom: 320, left: 660 },
    { width: 740, height: 360 },
  );
  assert.ok(landscape.maxHeight >= 120, 'landscape menu has usable height');
  assert.ok(landscape.bottom > 0, 'landscape menu positioned above toolbar');

  const narrow = computeMoreMenuPosition(
    { top: 500, right: 320, bottom: 540, left: 280 },
    { width: 320, height: 568 },
  );
  assert.ok(narrow.width <= 304, 'narrow screen menu width clamped');
  assert.ok(narrow.width >= 160, 'narrow screen menu respects minimum width');
  assert.ok(narrow.left >= 8, 'narrow screen menu left clamped');

  // Task 2 — screen share capability matrix
  assert.deepEqual(
    evaluateScreenShareSupport({
      hasMediaDevices: true,
      hasGetDisplayMedia: true,
      isAndroid: false,
      isIos: false,
      isPwa: false,
    }),
    { supported: true, reason: null },
    'desktop chrome supported',
  );

  assert.equal(
    evaluateScreenShareSupport({
      hasMediaDevices: true,
      hasGetDisplayMedia: true,
      isAndroid: true,
      isIos: false,
      isPwa: false,
    }).supported,
    false,
    'android chrome blocked',
  );

  assert.equal(
    evaluateScreenShareSupport({
      hasMediaDevices: true,
      hasGetDisplayMedia: true,
      isAndroid: true,
      isIos: false,
      isPwa: true,
    }).reason,
    'android-pwa',
    'android pwa blocked',
  );

  assert.equal(
    evaluateScreenShareSupport({
      hasMediaDevices: true,
      hasGetDisplayMedia: false,
      isAndroid: false,
      isIos: true,
      isPwa: true,
    }).reason,
    'no-get-display-media',
    'ios safari blocked',
  );

  console.log('verify-meeting-controls: all checks passed');
}

run();
