# Mobile PWA Meeting Controls — Final QA Release Report

**Generated:** 2026-06-23  
**Target device:** Realme 11 Pro (Android)  
**Status:** Awaiting manual QA approval — **do not merge**

---

## Release identifiers

| Field | Value |
|-------|-------|
| **Commit** | `320f98ce66809781361c381c75d67bbe401963d9` (`320f98c`) |
| **Branch** | `fix/mobile-pwa-meeting-controls` |
| **PR** | [#11](https://github.com/digitalraje-cell/bold-app/pull/11) |
| **Base** | `main` @ `ff2b45e` (current production) |

---

## Important: what to test

**Production (`bold.robozant.com`) does not include this fix yet.**  
Test the PR branch build using one of:

1. **Local dev (same WiFi):** `pnpm dev:web` → open `http://<your-mac-ip>:3000` on the phone
2. **After Vercel/Railway preview** is wired to PR branches
3. **Temporary deploy** of `fix/mobile-pwa-meeting-controls` to a staging URL

For **installed PWA** testing, install from the URL you use above (Add to Home screen).

---

## Changed files (10)

| File | Change |
|------|--------|
| `apps/web/src/components/meeting/ControlsBar.tsx` | Portal More menu, viewport positioning, screen-share blocked state |
| `apps/web/src/components/meeting/MeetingRoom.tsx` | Capability gating, lifecycle hook, diagnostic publish (dev-only) |
| `apps/web/src/hooks/useMeetingPageLifecycle.ts` | **New** — foreground recovery |
| `apps/web/src/lib/dev/is-dev-environment.ts` | **New** — dev guard |
| `apps/web/src/lib/media/compute-more-menu-position.ts` | **New** — menu layout math |
| `apps/web/src/lib/media/meeting-controls-diagnostics.ts` | **New** — dev-only logging |
| `apps/web/src/lib/media/screen-share-capability.ts` | **New** — platform detection |
| `docs/MOBILE_PWA_MEETING_CONTROLS_DIAGNOSTIC.md` | **New** — technical diagnostic |
| `docs/MOBILE_PWA_STABILITY_AUDIT.md` | **New** — lifecycle audit |
| `scripts/verify-meeting-controls.mjs` | **New** — automated positioning/capability checks |

---

## Automated pre-QA (passed)

```bash
node scripts/verify-meeting-controls.mjs   # ✓
pnpm build:web                             # ✓
```

---

## Manual QA checklist — Realme 11 Pro

Use **host/admin account**. Join or start a meeting. Tap the screen once if the toolbar is hidden.

### 1. More Actions menu (⋯)

| # | Test | Pass | Fail | Notes |
|---|------|------|------|-------|
| 1.1 | First tap opens menu | ☐ | ☐ | Menu appears **above** toolbar, not clipped |
| 1.2 | Tap outside closes menu | ☐ | ☐ | |
| 1.3 | Tap ⋯ again reopens menu | ☐ | ☐ | No stuck state |
| 1.4 | Portrait — all items visible/scrollable | ☐ | ☐ | Rotate to portrait |
| 1.5 | Landscape — all items visible/scrollable | ☐ | ☐ | Rotate to landscape |
| 1.6 | Select item → menu closes + action runs | ☐ | ☐ | e.g. Raise hand |

**Code confidence:** Portal + `useLayoutEffect` positioning + 250ms outside-click grace + Escape key. Automated clamp tests cover 360px / 320px widths (Realme 11 Pro ≈ 393px logical width).

### 2. Host / Admin features (More menu)

| # | Test | Role | Pass | Fail |
|---|------|------|------|------|
| 2.1 | Reactions (emoji picker → send) | All* | ☐ | ☐ |
| 2.2 | Raise hand / Lower hand | All* | ☐ | ☐ |
| 2.3 | Go Live on YouTube (opens modal) | Host/Co-host | ☐ | ☐ |
| 2.4 | Mute all | Host/Co-host | ☐ | ☐ |
| 2.5 | Waiting room on/off | Host only | ☐ | ☐ |
| 2.6 | Lock / Unlock meeting | Host only | ☐ | ☐ |
| 2.7 | Participant sharing on/off | Host only | ☐ | ☐ |

\*If enabled in meeting settings (`reactionsEnabled`, `raiseHandEnabled`).

### 3. Meeting controls (toolbar)

| # | Test | Pass | Fail |
|---|------|------|------|
| 3.1 | Mic mute / unmute | ☐ | ☐ |
| 3.2 | Camera on / off | ☐ | ☐ |
| 3.3 | Chat panel open / close | ☐ | ☐ |
| 3.4 | Participants panel open / close | ☐ | ☐ |
| 3.5 | Presenter view (layout menu) | ☐ | ☐ |
| 3.6 | Leave meeting | ☐ | ☐ |
| 3.7 | Screen share — dimmed + message on tap | ☐ | ☐ | Expected on Android |

### 4. Mobile lifecycle

| # | Test | Pass | Fail | Expected |
|---|------|------|------|----------|
| 4.1 | Switch app away → return | ☐ | ☐ | Meeting continues; toolbar visible on return |
| 4.2 | Lock screen → unlock | ☐ | ☐ | Same as above |
| 4.3 | WiFi → mobile data | ☐ | ☐ | Brief reconnect possible; no forced leave |
| 4.4 | Airplane mode 10s → off | ☐ | ☐ | "Reconnecting…" may show; recovers or offers retry |

---

## Code review summary (pre-device)

| Area | Pre-QA verdict | Evidence |
|------|----------------|----------|
| More menu open/close | **Ready for device QA** | Portal, grace period, orientation listener |
| Host/admin item gates | **Unchanged logic** | `isHost` / `isModerator` props in `MeetingRoom` |
| Core toolbar | **Unchanged handlers** | Only share button gains `blocked` state |
| Lifecycle | **Improved** | `useMeetingPageLifecycle` → `revealControls` |
| Screen share Android | **By design blocked** | `screen-share-capability.ts` |

---

## Remaining known limitations

1. **Screen share on Android** — Not supported by platform; button shown dimmed with explanatory message on tap.
2. **Layout menu** — Still in-toolbar dropdown; may clip on very narrow toolbars (lower risk than More menu).
3. **Post–phone-call mic** — OS may leave mic muted; user must tap unmute manually.
4. **Jitsi reconnect cap** — After 4 failed media reconnects, user must retry or rejoin.
5. **No Vercel PR preview** — Device QA requires local dev URL or staging deploy of this branch.
6. **Production diagnostics** — Stripped in prod builds; use `pnpm dev` + USB remote debugging if logs needed.

---

## Recommended merge decision

| Condition | Decision |
|-----------|----------|
| All §1–§3 checks pass on Realme 11 Pro (Chrome + installed PWA) | **Approve merge** of PR #11 |
| §4 lifecycle: meeting survives background/network with recoverable media | **Approve merge** |
| More menu still does not open on first tap | **Do not merge** — report back with screen recording |
| Host items missing for admin user | **Do not merge** — confirm role is HOST in participants list |

**Current recommendation:** **HOLD** — automated checks pass; **await your device QA sign-off**.

---

## After your approval

Reply with: `QA approved` or list failing checklist items.  
I will merge PR #11 to `main` and trigger Railway production deploy only when you explicitly approve.

---

## Quick dev test on Realme 11 Pro

```bash
# On Mac (same WiFi as phone)
pnpm dev:web
# Note your Mac IP: ipconfig getifaddr en0
# On phone Chrome: http://<MAC_IP>:3000
# Log in → start/join meeting → run checklist above
```

For PWA: Chrome menu → **Install app** / **Add to Home screen** from that URL.
