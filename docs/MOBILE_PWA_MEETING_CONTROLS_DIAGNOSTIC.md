# Mobile PWA Meeting Controls — Diagnostic Report

**Date:** 2026-06-23  
**Scope:** More Actions menu (Issue 1) and screen share (Issue 2) on Android PWA  
**Components:** `ControlsBar.tsx`, `MeetingRoom.tsx`, `useJitsi.ts`

---

## Executive summary

| Issue | Root cause | Fix applied |
|-------|------------|-------------|
| More Actions menu does not open on Android PWA | Dropdown rendered inside `overflow-x-auto` toolbar — menu opens in React state but is **clipped and invisible**. Same-tap `mousedown` outside-click handler could also close it immediately on some touch devices. | Portal dropdown to `document.body` with fixed positioning within viewport; delayed `pointerdown` outside-click handler; diagnostic logging. |
| Screen share fails on Android PWA | `navigator.mediaDevices.getDisplayMedia` is unavailable or non-functional on Android (including installed PWA). Jitsi `toggleShareScreen` depends on this API. | Capability detection before share; user-friendly error message; detailed console logging. |

---

## Issue 1 — More Actions menu

### Component location

- **File:** `apps/web/src/components/meeting/ControlsBar.tsx`
- **Button:** `ControlButton` with `MoreHorizontal` icon, `aria-label="More options"`
- **State:** `moreOpen` / `setMoreOpen`
- **Parent:** `MeetingRoom.tsx` passes role props (`isHost`, `isModerator`, `canManageBroadcast`, etc.)

### Event handlers

| Event | Handler | Expected behavior |
|-------|---------|-------------------|
| Button `onClick` | `setMoreOpen(v => !v)` | Toggles menu open state |
| Document `pointerdown` (capture, delayed) | Close if outside anchor + menu | Dismiss menu |
| `onRevealControls` on toolbar wrapper | `revealControls` from auto-hide hook | Keeps toolbar visible on interaction |

### Role-based visibility (`hasMoreItems`)

Menu button appears when any of:

- `reactionsEnabled`
- `raiseHandEnabled`
- `onInvite` (moderator)
- `onSwitchRoomMode` (moderator)
- `onToggleFullscreen` (always passed)
- `onToggleLock` (host)
- `onToggleWaitingRoom` (host)
- `onToggleParticipantScreenShare` (host)
- `onMuteAll` (moderator)
- `canManageBroadcast && onGoLive` (moderator)
- `isHost && onEndMeeting` (host)

**Per-item gates inside menu:**

| Item | Condition |
|------|-----------|
| Reactions | `reactionsEnabled` |
| Raise hand | `raiseHandEnabled` |
| YouTube Live | `canManageBroadcast && onGoLive` / `onStopLive` |
| Mute all | `isModerator && onMuteAll` |
| Lock / waiting room / participant sharing / end meeting | `isHost` + respective handler |

### Z-index / stacking

| Layer | z-index | pointer-events |
|-------|---------|----------------|
| Jitsi shell | default | auto |
| Tap-to-reveal overlay (hidden controls) | z-20 | auto |
| Reactions overlay | z-20 | none |
| Controls bar wrapper | z-40 | none (inner bar: auto) |
| More menu (before fix) | z-50 inside overflow parent | clipped |
| More menu (after fix) | z-60 portal on `body` | auto |

### Console diagnostics (development only)

Filter DevTools console by `[bold:meeting-controls]` when running `pnpm dev`:

- `more-menu-toggle` — tap fired, new open state
- `more-menu-open` / `more-menu-close` — state transitions

Inspect `window.__BOLD_MEETING_DIAGNOSTICS__` on device via remote debugging (dev builds only).

Production builds do not emit these logs or expose the global.

---

## Issue 2 — Screen share

### Code path

1. `ControlsBar` Share button → `onToggleShare`
2. `MeetingRoom.handleToggleShare` → role check → capability check → `useJitsi.toggleShareScreen`
3. `useJitsi` → `api.executeCommand('toggleShareScreen')`
4. Jitsi uses `getDisplayMedia` in supporting browsers

YouTube Live uses a **separate** `getDisplayMedia` path in `useYouTubeLiveStream.ts` (host-only).

### Browser support matrix

| Environment | `getDisplayMedia` | In-meeting screen share |
|-------------|-------------------|-------------------------|
| Desktop Chrome | Yes | Supported via Jitsi |
| Desktop Edge | Yes | Supported via Jitsi |
| Android Chrome | No / limited | **Not supported** — show message |
| Android PWA (installed) | No / limited | **Not supported** — show message |
| iOS Safari / PWA | No | **Not supported** — show message |

### Console diagnostics

Filter by:

- `[bold:meeting-controls] screen-share-attempt`
- `[bold:meeting-controls] screen-share-blocked`
- `[media] toggleShareScreen`
- `[media] screenSharingStatusChanged`

---

## Verification checklist

### Issue 1 — More Actions

- [ ] Android PWA: tap More options → menu visible above toolbar
- [ ] Menu items match role (host sees lock/end; moderator sees mute all/YouTube)
- [ ] Console shows `more-menu-toggle` with `moreOpen: true`
- [ ] `window.__BOLD_MEETING_DIAGNOSTICS__.menu.moreOpen` updates

### Issue 2 — Screen share

- [ ] Desktop Chrome: share starts, `screenSharingStatusChanged` with `on: true`
- [ ] Android PWA: tap share → friendly error banner, no silent failure
- [ ] Console shows `screen-share-blocked` with `reason`

---

## Files changed

- `apps/web/src/components/meeting/ControlsBar.tsx`
- `apps/web/src/components/meeting/MeetingRoom.tsx`
- `apps/web/src/hooks/useJitsi.ts`
- `apps/web/src/lib/media/screen-share-capability.ts` (new)
- `apps/web/src/lib/media/meeting-controls-diagnostics.ts` (new)
