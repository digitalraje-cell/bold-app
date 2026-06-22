# Release: Launch Readiness — Change Report

**Branch:** `release/launch-readiness`  
**Base:** `main` @ `06fceab` (PR #9 — last production deploy)  
**Generated:** 2026-06-22  
**Status:** PR open — **not merged, not deployed**

---

## Summary

This release bundles launch-readiness work: meeting UX polish, responsive overflow fixes, YouTube multi-channel streaming, Max plan waitlist (coming soon), PWA update manager, admin analytics, and QA tooling. **Max multi-platform streaming remains gated** behind `MAX_PLAN_ENABLED` (not set).

---

## Files changed

### Modified (57 tracked files)

| Area | Files | Lines (approx) |
|------|-------|----------------|
| API — Prisma schema | `schema.prisma` | +140 |
| API — YouTube / Stream | `youtube.service.ts`, `stream.service.ts`, gateways, DTOs | +800 |
| API — Admin | guards, module | +35 |
| API — Meetings / Participants / Gateway | realtime media sync | +70 |
| Web — Meeting room | `MeetingRoom`, panels, controls, YouTube modal | +900 |
| Web — Marketing / Pricing | responsive tables, Max card | +120 |
| Web — Dashboard / Admin / Billing | mobile layouts, overflow fixes | +250 |
| Web — PWA | `sw.js`, update manager (replaces `PwaRegistrar`) | +200 |
| Web — Layout / Shell | overflow containment, `ClientProviders` | +120 |
| Shared | max-plan, youtube limits, stream types, pricing | +60 |
| Scripts / config | `railway-build-web.sh`, `next.config.ts`, `package.json` | +15 |

### Added (untracked → new)

| Category | Key paths |
|----------|-----------|
| **Migrations (5)** | `20250622120000_app_releases` … `20250622170000_max_waitlist_destinations` |
| **API — Admin** | feature-interest, product-analytics, releases, youtube stats controllers/services |
| **API — Integrations** | `integrations/`, `plan-interest/` modules |
| **Web — Pages** | `/max`, `/meetings`, `/settings/integrations`, admin analytics pages |
| **Web — Components** | `IntegrationsSettings`, `MaxPlanPageContent`, `PlanComparisonTable`, PWA update UI |
| **Web — Hooks/Stores** | `useMeetingControlsAutoHide`, `pwaUpdateStore`, `admin-access` |
| **Shared** | `max-plan.ts`, `youtube/plan-limits.ts`, `integrations/providers.ts` |
| **Docs** | `LAUNCH_READINESS.md`, `QA_LAUNCH_SPRINT_REPORT.md`, QA audit JSON + screenshots |
| **Scripts** | `qa-responsive-audit.mjs`, validation scripts |

### Deleted

- `apps/web/src/components/pwa/PwaRegistrar.tsx` — replaced by `PwaUpdateManager` + `PwaUpdateManagerClient`

---

## Features completed

| Feature | Status | Notes |
|---------|--------|-------|
| Meeting toolbar auto-hide + safe-area | Done | 4s idle, reveal on touch |
| Chat / Participants mobile full-screen | Done | Overlays below toolbar |
| Real-time mic/camera via `participant:media` | Done | Socket + panel sync |
| Responsive overflow elimination | Done | Plan comparison cards, admin mobile lists |
| YouTube OAuth + channel management | Done | Settings → Integrations |
| Multi-destination YouTube streams (Pro) | Done | Plan limits enforced |
| Max plan marketing + waitlist | Done | `/max`, coming soon — **not enabled for streaming** |
| PWA service worker update flow | Done | Toast, meeting banner, force-update modal |
| Admin product analytics | Done | `/admin/product-analytics` |
| Admin feature interest / waitlist | Done | `/admin/feature-interest` |
| Admin YouTube stats | Done | `/admin/youtube` |
| App releases / version API | Done | `/api/app/version` |
| QA responsive audit tooling | Done | `pnpm qa:responsive` |
| RBAC / host onboarding | **Not included** | Out of scope |

---

## Database migrations (new on this branch)

| Migration | Purpose |
|-----------|---------|
| `20250622120000_app_releases` | `AppRelease` model for version/force-update |
| `20250622140000_youtube_multi_account` | Multi YouTube account per user |
| `20250622150000_youtube_channel_management` | Channel avatar, multi-stream per meeting |
| `20250622160000_max_plan_waitlist_and_connected_accounts` | `ConnectedAccount`, `PlanInterest` |
| `20250622170000_max_waitlist_destinations` | `expectedDestinations` on waitlist |

**Deploy note:** `railway-start-*.sh` runs `prisma migrate deploy` with `db push` fallback.

---

## Environment variables required

### Railway WEB (`@boldmeet/web`) — existing + verify

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Yes | Session signing |
| `AUTH_URL` / `NEXTAUTH_URL` | Yes | `https://bold.robozant.com` |
| `DATABASE_URL` | Yes | Same Postgres as API |
| `JWT_SECRET` | Yes | Must match API |
| `API_URL` | Yes | Nest API public URL |
| `NEXT_PUBLIC_API_URL` | Yes | Same as `API_URL` |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Same as `API_URL` |
| `RESEND_API_KEY` | Yes (prod) | OTP email |
| `EMAIL_FROM` | Yes (prod) | Verified Resend sender |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://bold.robozant.com` |

### Railway WEB — optional / new

| Variable | Default | Notes |
|----------|---------|-------|
| `MAX_PLAN_ENABLED` | unset (false) | Set `true` only when multi-platform ready |
| `NEXT_PUBLIC_MAX_PLAN_ENABLED` | unset | Client-side Max launch flag |
| `NEXT_PUBLIC_APP_VERSION` | from build script | Set by `railway-build-web.sh` |
| `NEXT_PUBLIC_BUILD_ID` | from build script | Cache-bust service worker |

### Railway API (`@boldmeet/api`) — existing + verify

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | |
| `JWT_SECRET` | Yes | Match web |
| `ENCRYPTION_KEY` | Yes | OAuth token encryption |
| `CORS_ORIGIN` | Yes | `https://bold.robozant.com` |
| `FRONTEND_URL` | Yes | OAuth redirects |
| `YOUTUBE_CLIENT_ID` | For YouTube Live | Google Cloud OAuth |
| `YOUTUBE_CLIENT_SECRET` | For YouTube Live | |
| `YOUTUBE_REDIRECT_URI` | For YouTube Live | API callback URL |

---

## Deployment risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Railway billing / trial ended | **Blocker** | Enable billing before deploy |
| 5 new DB migrations | High | Run `migrate deploy` on staging first; backup DB |
| `PwaRegistrar` → `PwaUpdateManager` | Medium | Users may need hard refresh; SW cache-bust via build ID |
| `MAX_PLAN_ENABLED` accidentally set | Medium | Leave unset until multi-platform ready |
| YouTube OAuth redirect URI | Medium | Verify Google Console matches production API URL |
| Large QA screenshot commit (+27MB) | Low | Screenshots **gitignored** — preserved locally at `docs/qa-screenshots/` |
| `force-dynamic` on root + dashboard layouts | Low | All pages SSR — expected for auth-heavy app |
| Web build requires `NODE_ENV=production` | Low | `next build` sets this automatically; Railway OK |

---

## Build verification

```bash
NODE_ENV=production pnpm build:api   # PASS
NODE_ENV=production pnpm build:web   # PASS
```

---

## Production comparison

| | Production (`06fceab`) | This branch |
|---|------------------------|-------------|
| PWA | `PwaRegistrar` | `PwaUpdateManager` |
| YouTube | Single channel paste | OAuth + multi-channel |
| Max plan | Not present | Marketing + waitlist |
| Meeting UX | Basic panels | Auto-hide toolbar, mobile overlays |
| Admin analytics | Users/payments only | Product + feature interest + YouTube |

---

*Do not merge until Railway billing is active and staging smoke test passes.*
