# Deployment Validation Report — v0.2.0

**Date:** 2026-06-22  
**Release branch:** `release/v0.2.0`  
**Release tag:** `v0.2.0`  
**Commit:** `f6fba65027404c900bb30e7adef02e8c615a3dfe`  
**PR:** https://github.com/digitalraje-cell/bold-app/pull/1  
**Staging branch pushed:** `staging` (tracks `release/v0.2.0`)

---

## Phase 3 — Railway deployment

### Status: **BLOCKED — staging not deployed**

| Check | Result | Notes |
|-------|--------|-------|
| Deploy `release/v0.2.0` to Railway staging | ❌ Blocked | Railway CLI logged in as `digitalraje@gmail.com` but Bold project is **not** in this workspace (only `authoritynova-staging` visible) |
| Bold production Railway project | `triumphant-adaptation / production` | Deploys via GitHub integration from **`main` only** |
| Latest production deploy ref | `b8e6515` | Does **not** include v0.2.0 changes |
| Staging environment | ❌ Not configured | No separate Railway staging/preview environment in GitHub deployments |
| `staging` branch pushed | ✅ | `origin/staging` → `f6fba65` — requires Railway dashboard to point a service at this branch |

### Production URLs (current — pre-v0.2.0)

| Service | URL | Health |
|---------|-----|--------|
| Web | https://bold.robozant.com | ✅ 200 |
| API | https://boldmeetapi-production.up.railway.app | ✅ `/api/health` 200, DB connected |
| Railway web (direct) | https://boldmeetweb-production.up.railway.app | ✅ 200 |

### Required action to deploy v0.2.0 for validation

Choose one:

1. **Railway dashboard** → Web + API services → Settings → Branch = `release/v0.2.0` or `staging` → Redeploy  
2. **Merge PR #1 to `main`** after validation (currently **not recommended** — staging deploy incomplete)  
3. **Link Railway CLI** to the Bold project workspace and run deploy from `release/v0.2.0`

---

## Phase 4 — Validation results

### A. Local release stack (`release/v0.2.0` @ localhost)

**Command:** `node scripts/release-validation.mjs`  
**Result:** ✅ **19/19 PASS**

| Test | Result |
|------|--------|
| Web URL 200 | ✅ |
| API health 200 | ✅ |
| Database connected | ✅ |
| Auth status | ✅ |
| Mobile layout loads | ✅ |
| Credentials login | ✅ |
| Create meeting | ✅ |
| Join meeting ID + passcode | ✅ |
| Join direct link | ✅ |
| Host jitsi-token (v0.2.0) | ✅ `jwtEnabled=false` (no JITSI_APP_* locally) |
| Guest jitsi-token | ✅ |
| Co-host promote/remove | ✅ |
| Webinar mode | ✅ |
| Meeting lobby page | ✅ |
| Socket.io handshake | ✅ |
| A/V connect | ⚠️ Manual browser verification |
| No Jitsi login prompts | ⚠️ Manual browser verification |

**Release smoke test:** ✅ 18/18 (`node scripts/release-smoke-test.mjs`)

### B. Production smoke (`bold.robozant.com` — still on `b8e6515`)

**Command:** `VERIFY_WEB_URL=https://bold.robozant.com VERIFY_API_URL=https://boldmeetapi-production.up.railway.app/api node scripts/release-validation.mjs`  
**Result:** ❌ **5/6 — incomplete (not v0.2.0)**

| Test | Result | Notes |
|------|--------|-------|
| Web URL 200 | ✅ | |
| API health 200 | ✅ | |
| Database connected | ✅ | |
| Auth status | ✅ | |
| Mobile layout | ✅ | |
| Credentials login | ❌ | No production test account in CI; local `e2e-host@bold.test` not on prod DB |
| v0.2.0 `jitsi-token` endpoint | ❌ | Returns **404** on production (expected — not deployed yet) |

---

## Merge decision

### ⛔ **DO NOT merge to `main`**

**Reason:** v0.2.0 has **not** been deployed to Railway staging/preview. Production still runs `b8e6515`. Full production validation of v0.2.0 features (JWT media access, Jitsi auth removal) cannot pass until the release branch is deployed.

---

## Rollback reference

| Item | Value |
|------|-------|
| Current production commit | `b8e6515caf47b0840041d19351c60f6b4e396217` |
| Rollback | Redeploy Railway production from `b8e6515` or revert merge if already merged |
| Release candidate | `f6fba65` on `release/v0.2.0` |

---

## Next steps

1. In Railway dashboard, deploy **`release/v0.2.0`** (or `staging`) to a preview/staging environment  
2. Set `VERIFY_WEB_URL` / `VERIFY_API_URL` to staging URLs  
3. Re-run: `node scripts/release-validation.mjs`  
4. Complete manual browser checks (A/V, Jitsi UI, host controls on mobile)  
5. If all pass → merge PR #1 to `main` → Railway production auto-deploys
