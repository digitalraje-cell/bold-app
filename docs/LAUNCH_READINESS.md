# Bold Launch Readiness — Post-MAX Execution Plan

**Status:** In progress  
**Scope freeze:** No new plans, no new streaming providers (Twitch, X, etc.) until production validation completes.

---

## Phase 1 — Meeting Experience (HIGHEST PRIORITY)

### Implemented (this sprint)

| Item | Status | Files |
|------|--------|-------|
| Toolbar safe-area + Jitsi bottom padding | Done | `globals.css`, `ControlsBar.tsx` |
| Toolbar auto-hide (4s idle, reveal on move/tap) | Done | `useMeetingControlsAutoHide.ts`, `ControlsBar.tsx`, `MeetingRoom.tsx` |
| `viewport-fit=cover` for iOS safe areas | Done | `app/layout.tsx` |
| Chat: full-screen overlay on mobile, side panel desktop | Done | `ChatPanel.tsx` |
| Participants: full-screen mobile, side panel desktop | Done | `ParticipantsPanel.tsx` |
| Real-time mic/camera via `participant:media` socket | Done | `meeting.gateway.ts`, `useRoom.ts`, `MeetingRoom.tsx` |
| Host mute broadcasts `participant:update` | Done | `participants.service.ts` |
| Participant panel live status colors + aria labels | Done | `ParticipantsPanel.tsx` |

### Remaining (manual QA)

- [x] Responsive screenshot audit at: 320, 360, 375, 390, 412, 768, 1024, 1366, 1440, 1920 px — see `docs/QA_LAUNCH_SPRINT_REPORT.md`
- [ ] Verify toolbar never covers Jitsi participant names on all breakpoints
- [ ] iOS Safari + Android Chrome in-meeting smoke test
- [ ] ESC / tap-outside to close panels (optional polish)

---

## Phase 2 — Admin & User Management (RBAC)

### Exists

- `USER` / `ADMIN` / `SUPER_ADMIN` in Prisma + `packages/shared/src/admin/roles.ts`
- `AdminGuard`, `SuperAdminGuard`
- Super admin: `digitalraje@gmail.com` (hardcoded fallback + OTP promotion)
- Basic user list + Pro activate/deactivate

### Not built yet

- [ ] `PATCH /admin/users/:id/role` (super-admin only)
- [ ] Admin cannot access billing/platform settings (route-level split)
- [ ] Full CRUD: create, disable, delete, search, filters, pagination
- [ ] Audit log for admin actions
- [ ] Admin → Admins management UI

---

## Phase 3 — Host Profile Onboarding

### Not built yet

- [ ] Prisma: `organization`, `company`, `designation`, `website` on `User`
- [ ] Post-signup onboarding flow
- [ ] Use profile in meeting branding + YouTube metadata

---

## Phase 4 — YouTube Live Validation (NO NEW CODE)

Manual e2e checklist — record PASS/FAIL + screenshots:

| Test | Result | Notes |
|------|--------|-------|
| OAuth connect | PENDING | |
| Connected channel in Settings → Integrations | PENDING | |
| Public stream | PENDING | |
| Unlisted stream | PENDING | |
| Private stream | PENDING | |
| Video reaches YouTube | PENDING | |
| Audio reaches YouTube | PENDING | |
| Watch URL generated | PENDING | |
| Reconnect after page refresh | PENDING | |
| Auto-stop on meeting end | PENDING | |

**Blocker for production deploy:** All critical rows must PASS with screenshot evidence.

---

## Phase 5 — PWA Production Validation (NO NEW CODE)

| Environment | Install | Update | Reconnect | Standalone | Notifications |
|-------------|---------|--------|-----------|------------|---------------|
| Android Chrome | PENDING | PENDING | PENDING | PENDING | PENDING |
| Android PWA | PENDING | PENDING | PENDING | PENDING | PENDING |
| iPhone Safari | PENDING | PENDING | PENDING | PENDING | PENDING |
| iPhone A2HS | PENDING | PENDING | PENDING | PENDING | PENDING |
| Desktop PWA | PENDING | PENDING | PENDING | PENDING | PENDING |

---

## Phase 6 — Founder Dashboard

### Implemented

- `GET /admin/product-analytics/stats`
- Admin UI: `/admin/product-analytics`
- Metrics: users, active 7d/30d, free/pro, Max waitlist, meetings, avg duration, PWA, YouTube streams/channels, high-intent waitlist

### Related

- `/admin/feature-interest` — provider + destination demand detail

---

## Database changes (this sprint)

None new for Phase 1. Prior migrations include `plan_interests`, `connected_accounts`.

---

## API changes (this sprint)

| Endpoint | Change |
|----------|--------|
| Socket `participant:media` | Client reports mic/camera; broadcasts `participant:update` |
| `GET /admin/product-analytics/stats` | New founder metrics aggregate |

---

## Launch readiness verdict

| Area | Ready? |
|------|--------|
| MAX Coming Soon | Yes (approved, frozen) |
| Meeting UX Phase 1 code | Partial — needs device QA |
| YouTube Live production | **No** — Phase 4 not validated |
| PWA production | **No** — Phase 5 not validated |
| RBAC / onboarding | **No** — Phases 2–3 not built |
| Founder analytics | Yes (initial) |

**Recommendation:** Complete Phase 4 YouTube e2e + Phase 1 responsive screenshots before production deploy. Do not enable `MAX_PLAN_ENABLED`.

---

## Files changed (this sprint)

### Web
- `apps/web/src/hooks/useMeetingControlsAutoHide.ts` (new)
- `apps/web/src/components/meeting/ControlsBar.tsx`
- `apps/web/src/components/meeting/ChatPanel.tsx`
- `apps/web/src/components/meeting/ParticipantsPanel.tsx`
- `apps/web/src/components/meeting/MeetingRoom.tsx`
- `apps/web/src/components/meeting/FullscreenWrapper.tsx`
- `apps/web/src/hooks/useRoom.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/(dashboard)/admin/product-analytics/page.tsx` (new)
- `apps/web/src/lib/sidebar-nav-config.tsx`
- `apps/web/src/lib/api.ts`

### API
- `apps/api/src/gateway/meeting.gateway.ts`
- `apps/api/src/participants/participants.service.ts`
- `apps/api/src/admin/admin-product-analytics.service.ts` (new)
- `apps/api/src/admin/admin-product-analytics.controller.ts` (new)
- `apps/api/src/admin/admin.module.ts`

### Docs
- `docs/LAUNCH_READINESS.md` (this file)
