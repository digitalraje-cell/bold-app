# Mobile PWA Meeting Stability Audit

**Date:** 2026-06-23  
**Scope:** Backgrounding, network changes, media recovery, rejoin flows  
**Related fix branch:** `fix/mobile-pwa-meeting-controls`

---

## Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| App backgrounding / return | **Improved** | `useMeetingPageLifecycle` reveals controls on `visibilitychange`, `pageshow`, `focus`, `online` |
| Screen lock / unlock | **Improved** | Same lifecycle hook fires on visibility restore |
| Incoming phone call | **Partial** | Jitsi handles media interruption internally; Bold shows existing reconnecting UI via `useJitsi` |
| Network disconnect / reconnect | **Existing** | Socket.io auto-reconnect; Jitsi reconnects up to 4 attempts (`MAX_RECONNECT_ATTEMPTS`) |
| WiFi ↔ mobile data | **Existing** | Treated as network reconnect; lifecycle hook reveals controls |
| Camera recovery after reconnect | **Existing** | Jitsi `videoMuteStatusChanged` listener syncs state |
| Microphone recovery after reconnect | **Existing** | Jitsi `audioMuteStatusChanged` listener syncs state |
| Rejoin after temporary disconnect | **Existing** | User sees "Reconnecting…" banner; manual rejoin via lobby if Jitsi exhausts retries |

---

## Findings by scenario

### 1. App backgrounding

**Before:** Toolbar could stay hidden after returning from another app (auto-hide idle state).  
**Fix:** `useMeetingPageLifecycle` calls `revealControls()` when the page becomes visible again.  
**Not changed:** Jitsi iframe session is left intact (no dispose on background) to avoid unnecessary teardown.

### 2. Screen lock / unlock

Same as backgrounding — `document.visibilityState === 'visible'` triggers control reveal.  
Media tracks may mute briefly; Jitsi typically recovers without a full page reload.

### 3. Incoming phone call

On Android, the OS may pause camera/mic. Bold does not intercept telephony events directly.  
`useJitsi` reconnect logic handles dropped conference connections.  
**Known limitation:** User may need to manually unmute after a call if OS leaves mic muted.

### 4. Network disconnect / reconnect

- **Signaling:** `useSocket` uses socket.io with websocket transport; reconnects automatically.
- **Media:** `useJitsi` schedules reconnect with 2s delay, max 4 attempts.
- **UI:** `isReconnecting` shows "Reconnecting…" overlay in `MeetingRoom`.

### 5. WiFi to mobile data

No special handling required — socket and Jitsi treat as transient network loss.  
Lifecycle hook ensures controls are visible after `online` event.

### 6–7. Camera / microphone recovery

State synced via Jitsi event listeners in `useJitsi.ts`:
- `audioMuteStatusChanged`
- `videoMuteStatusChanged`

Participant media state is also emitted over socket (`participant:media`).

### 8. Rejoin after disconnect

If Jitsi exhausts reconnect attempts, user sees media error via `MediaConnectionError` with retry.  
Leaving and rejoining from `/join` remains the fallback path.

---

## Meeting controls regression (code review)

| Feature | Component | Status |
|---------|-----------|--------|
| Camera on/off | `ControlsBar` → `handleToggleVideo` | Unchanged |
| Mic mute/unmute | `ControlsBar` → `handleToggleMic` | Unchanged |
| Participants panel | `ControlsBar` → `setActivePanel('participants')` | Unchanged |
| Chat | `ControlsBar` → `setActivePanel('chat')` | Unchanged |
| Reactions | More menu → `handleReaction` | Unchanged |
| Raise hand | More menu → `handleRaiseHand` | Unchanged |
| Presenter view | `useMeetingLayout` / Jitsi tile view | Unchanged |
| Host / admin controls | More menu role gates | Unchanged |
| YouTube Live | More menu → `handleGoLive` | Unchanged |
| Leave meeting | `ControlsBar` leave button | Unchanged |

---

## Remaining known issues

1. **Screen share on mobile** — Blocked by platform; button shown dimmed with explanatory message (by design).
2. **Layout menu on mobile** — Still uses in-toolbar dropdown (not portaled); may clip on very narrow screens if many toolbar buttons visible. Lower priority than More options.
3. **Post-phone-call mic** — OS may leave mic muted; user must tap unmute manually.
4. **Jitsi reconnect limit** — After 4 failed attempts, user must use media error retry or rejoin.

---

## Verification commands

```bash
node scripts/verify-meeting-controls.mjs
pnpm build:web
```

Diagnostics (`[bold:meeting-controls]`, `window.__BOLD_MEETING_DIAGNOSTICS__`) are **development-only** and stripped from production builds.

Manual QA checklist: see verification checklist below.
