# Deployment Verification Report — PR #10 Pre-Merge

**Date:** 2026-06-22  
**PR:** [#10 Release: Launch Readiness](https://github.com/digitalraje-cell/bold-app/pull/10)  
**Branch:** `release/launch-readiness` @ `60eb818`  
**Production baseline:** `main` @ `06fceab` (deployed 2026-06-22 10:29 UTC)

---

## Decision: **STOP — DO NOT MERGE YET**

Migrations are **safe (additive)**. Deployment is **blocked** pending Railway billing confirmation and full environment variable audit on the **Bold** Railway project (`triumphant-adaptation`).

---

## 1. Railway deployment availability

| Check | Result | Evidence |
|-------|--------|----------|
| Production web live | **YES** | `https://bold.robozant.com/login` → HTTP 200 |
| Production API live | **YES** | `https://boldmeetapi-production.up.railway.app/api/health` → `database.connected: true` |
| Last successful deploy | **YES** | GitHub deployment `06fceab` @ 2026-06-22T10:29:06Z — both web + API success |
| New deploys accepted | **UNVERIFIED** | Railway CLI (`railway list`) shows only `authoritynova-staging` — **Bold project not linked**. Trial/billing status cannot be confirmed from CLI. |
| PR #10 commit deployed | **NO** | `60eb818` has no deployment record |

**Action required:** Log into [Railway Dashboard](https://railway.app) → project **triumphant-adaptation** → confirm billing active and deploy queue is not blocked before merging.

---

## 2. Environment variables

Cannot read Railway variable values via CLI (Bold project not linked). Inference from **live production** + code requirements:

| Variable | Service | Status | Evidence |
|----------|---------|--------|----------|
| `DATABASE_URL` | Web + API | **LIKELY SET** | API health: `configured: true, connected: true` |
| `AUTH_SECRET` | Web | **LIKELY SET** | `/api/auth/status`: `secretConfigured: true` |
| `JWT_SECRET` | Web + API | **LIKELY SET** | API proxy + sessions work on production (inferred) |
| `RESEND_API_KEY` | Web | **LIKELY SET** | Production OTP delivery confirmed in prior session |
| `EMAIL_FROM` | Web | **LIKELY SET** | Required for Resend delivery (inferred if OTP works) |
| `YOUTUBE_CLIENT_ID` | API | **UNVERIFIED** | No public endpoint exposes OAuth config; requires Railway dashboard check |
| `YOUTUBE_CLIENT_SECRET` | API | **UNVERIFIED** | Same |
| `YOUTUBE_REDIRECT_URI` | API | **UNVERIFIED** | Expected: `https://boldmeetapi-production.up.railway.app/youtube/callback` |

**Stop condition:** `YOUTUBE_*` vars are **critical for PR #10** (Settings → Integrations, multi-channel streaming). They must be confirmed in Railway **API service** variables before merge.

**Also verify on WEB service:** `API_URL`, `NEXTAUTH_URL`, `AUTH_URL`, `ENCRYPTION_KEY` (API), `CORS_ORIGIN`, `FRONTEND_URL`.

---

## 3. Migration review (5 new migrations)

### Summary: **ADDITIVE — no data loss expected**

| # | Migration | Operations | Destructive? | Data loss risk |
|---|-----------|------------|--------------|----------------|
| 1 | `20250622120000_app_releases` | `CREATE TABLE IF NOT EXISTS`, seed `INSERT … ON CONFLICT DO NOTHING` | No | None |
| 2 | `20250622140000_youtube_multi_account` | `DROP INDEX` (userId unique → composite), `ADD COLUMN IF NOT EXISTS`, `ADD FK` | No | None — index swap only |
| 3 | `20250622150000_youtube_channel_management` | `ADD COLUMN IF NOT EXISTS`, `DROP INDEX` (meetingId unique → composite), new indexes | No | None — index swap only |
| 4 | `20250622160000_max_plan_waitlist_and_connected_accounts` | `CREATE TYPE`, `CREATE TABLE` (connected_accounts, plan_interests), indexes, FKs | No | None — new tables only |
| 5 | `20250622170000_max_waitlist_destinations` | `ADD COLUMN IF NOT EXISTS expected_destinations` | No | None |

### Details

**No operations found:**
- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- `DELETE FROM`

**Index drops (non-destructive):**
- `youtube_accounts_userId_key` → replaced by `(userId, channelId)` unique — enables multi-channel per user
- `youtube_streams_meetingId_key` → replaced by `(meetingId, youtubeAccountId)` unique — enables multi-destination per meeting

**Deploy notes:**
- Migrations 4–5 use `CREATE TABLE` / `CREATE TYPE` without `IF NOT EXISTS` — safe on first run; will fail on re-apply if already applied (idempotent via `_prisma_migrations` table).
- `railway-start-api.sh` / `railway-start-web.sh` run `prisma migrate deploy` with `db push` fallback.

---

## 4. Merge / deploy status

| Step | Status |
|------|--------|
| Merge PR #10 | **NOT DONE** — blocked |
| Railway auto-deploy | **NOT TRIGGERED** |
| `prisma migrate deploy` | **NOT RUN** |
| Smoke tests | **NOT RUN** — requires deploy first |

---

## 5. Post-merge checklist (when unblocked)

1. Confirm Railway billing active on `triumphant-adaptation`
2. Confirm all 8 env vars in Railway dashboard (WEB + API services)
3. Merge PR #10: `gh pr merge 10 --merge`
4. Monitor Railway deployments for `@boldmeet/web` and `@boldmeet/api`
5. Verify migrations in API deploy logs: `Applying database migrations…`
6. Run smoke tests (see below)

---

## 6. Smoke test plan (after deploy)

| Test | Method | Pass criteria |
|------|--------|---------------|
| OTP login | `https://bold.robozant.com/login` | Email received, sign-in succeeds |
| Create meeting | Dashboard → New meeting | Meeting created, code returned |
| Join meeting | Second browser / guest link | Both in room, A/V works |
| Screen share | Host shares screen | Visible to participant |
| Mobile join | Phone browser 375px | Room loads, controls usable |
| PWA install | Chrome → Install app | Opens standalone, reopens |
| Admin login | `digitalraje@gmail.com` | `/admin` accessible |
| YouTube connect | Settings → Integrations → Connect | OAuth completes, channel listed |

---

## 7. Rollback plan

If deploy fails after merge:
- Railway → service → Deployments → redeploy `06fceab` deployment
- Or revert merge on `main` and redeploy

---

*Generated pre-merge. No infrastructure changes were made.*
