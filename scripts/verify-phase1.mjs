/**
 * Phase 1 local verification — logic checks that do not require Postgres.
 * Run: node scripts/verify-phase1.mjs
 */
import assert from 'node:assert/strict';
import {
  generateMeetingCode,
  normalizeMeetingCode,
  formatMeetingCode,
  canPerformRoomAction,
  RoomMode,
} from '../packages/shared/dist/index.js';

function participant(role, overrides = {}) {
  return {
    id: 'p1',
    displayName: 'Test',
    role,
    isMuted: false,
    isVideoOff: false,
    isOnStage: false,
    micAllowed: true,
    cameraAllowed: true,
    ...overrides,
  };
}

function canShareScreenInRoom(participant, roomMode, screenShareEnabled) {
  if (!participant) return false;
  if (participant.role === 'HOST' || participant.role === 'CO_HOST') return true;
  if (!screenShareEnabled) return false;
  if (roomMode === RoomMode.WEBINAR && !participant.isOnStage) return false;
  return ['PARTICIPANT', 'PANELIST'].includes(participant.role);
}

console.log('Phase 1 verification\n');

// 1. Numeric meeting IDs
for (let i = 0; i < 20; i += 1) {
  const code = generateMeetingCode();
  assert.match(code, /^[1-9]\d{9}$/, `code ${code} should be 10 digits`);
}
assert.equal(normalizeMeetingCode('725 832 1940'), '7258321940');
assert.equal(formatMeetingCode('7258321940'), '725 832 1940');
console.log('✓ numeric meeting IDs');

// 2. Screen share permissions
assert.equal(canShareScreenInRoom(participant('HOST'), RoomMode.MEETING, false), true);
assert.equal(canShareScreenInRoom(participant('CO_HOST'), RoomMode.MEETING, false), true);
assert.equal(
  canShareScreenInRoom(participant('PARTICIPANT'), RoomMode.MEETING, true),
  true,
);
assert.equal(
  canShareScreenInRoom(participant('PARTICIPANT'), RoomMode.MEETING, false),
  false,
);
console.log('✓ screen share permissions (meeting mode)');

// 3. Webinar stage permissions
assert.equal(
  canShareScreenInRoom(
    participant('PARTICIPANT', { isOnStage: false }),
    RoomMode.WEBINAR,
    true,
  ),
  false,
);
assert.equal(
  canShareScreenInRoom(
    participant('PANELIST', { isOnStage: true }),
    RoomMode.WEBINAR,
    true,
  ),
  true,
);
assert.equal(
  canPerformRoomAction('PARTICIPANT', 'useAudio', {
    roomMode: RoomMode.WEBINAR,
    isOnStage: false,
  }),
  false,
);
assert.equal(
  canPerformRoomAction('PANELIST', 'useAudio', {
    roomMode: RoomMode.WEBINAR,
    isOnStage: true,
    micAllowed: true,
  }),
  true,
);
console.log('✓ webinar mode permissions');

// 4. RBAC broadcast gated (Phase 1.5)
assert.equal(canPerformRoomAction('HOST', 'startBroadcast', { roomMode: RoomMode.MEETING }), true);
assert.equal(
  canPerformRoomAction('PARTICIPANT', 'startBroadcast', { roomMode: RoomMode.MEETING }),
  false,
);
console.log('✓ RBAC roles');

console.log('\nAll logic checks passed.');
