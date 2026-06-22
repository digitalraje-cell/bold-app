# YouTube Live — Deployment Checklist

**Google Cloud project:** AuthorityNova OAuth (reused for Bold)  
**Production web:** `https://bold.robozant.com`  
**Production API:** `https://boldmeetapi-production.up.railway.app`  
**Last updated:** 2026-06-22

---

## 1. Google Cloud Console checklist

Project: **AuthorityNova OAuth** → [Google Cloud Console](https://console.cloud.google.com/)

### APIs

- [ ] **YouTube Data API v3** enabled (APIs & Services → Library)

### OAuth consent screen

- [ ] App configured (External or Internal)
- [ ] Scopes added (see below)
- [ ] Support email set
- [ ] If **Testing**: add every host Gmail that will connect during launch, **or** publish app after Google verification
- [ ] Optional: update app name/branding to mention Bold for user trust

### OAuth scopes (exact)

Add both scopes to the consent screen:

```
https://www.googleapis.com/auth/youtube
https://www.googleapis.com/auth/youtube.force-ssl
```

These are already requested in code (`apps/api/src/youtube/youtube.service.ts`).

### OAuth 2.0 Client (Web application)

**Authorized JavaScript origins** (exact):

```
https://bold.robozant.com
http://localhost:3000
```

**Authorized redirect URIs** (exact):

```
https://boldmeetapi-production.up.railway.app/youtube/callback
http://localhost:4000/youtube/callback
```

> Redirect URI must match `YOUTUBE_REDIRECT_URI` on the Railway API service character-for-character.

### Credentials

- [ ] Copy **Client ID** → Railway API `YOUTUBE_CLIENT_ID`
- [ ] Copy **Client secret** → Railway API `YOUTUBE_CLIENT_SECRET`

---

## 2. Railway environment variables

### API service (`@boldmeet/api`)

| Variable | Production value | Required |
|----------|------------------|----------|
| `DATABASE_URL` | Postgres connection string | Yes |
| `JWT_SECRET` | Strong secret (match WEB) | Yes |
| `ENCRYPTION_KEY` | 32+ char stable secret — **do not rotate** after users connect | Yes |
| `NODE_ENV` | `production` | Yes |
| `CORS_ORIGIN` | `https://bold.robozant.com` | Yes |
| `FRONTEND_URL` | `https://bold.robozant.com` | Yes |
| `YOUTUBE_CLIENT_ID` | From AuthorityNova OAuth client | **Yes** |
| `YOUTUBE_CLIENT_SECRET` | From AuthorityNova OAuth client | **Yes** |
| `YOUTUBE_REDIRECT_URI` | `https://boldmeetapi-production.up.railway.app/youtube/callback` | **Yes** |
| `MAX_PLAN_ENABLED` | `false` | Yes |
| `AUTH_URL` | `https://bold.robozant.com` | Recommended |
| `PORT` | Set by Railway automatically | Auto |

FFmpeg is included via `nixpacks.toml` — no extra env var.

### WEB service (`@boldmeet/web`)

| Variable | Production value | Required |
|----------|------------------|----------|
| `DATABASE_URL` | Same Postgres as API | Yes |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Strong secret | Yes |
| `JWT_SECRET` | Same as API | Yes |
| `AUTH_URL` | `https://bold.robozant.com` | Yes |
| `NEXTAUTH_URL` | `https://bold.robozant.com` | Yes |
| `NEXT_PUBLIC_APP_URL` | `https://bold.robozant.com` | Yes |
| `API_URL` | `https://boldmeetapi-production.up.railway.app` | Yes |
| `NEXT_PUBLIC_API_URL` | `https://boldmeetapi-production.up.railway.app` | Yes |
| `NEXT_PUBLIC_SOCKET_URL` | `https://boldmeetapi-production.up.railway.app` | Yes |
| `RESEND_API_KEY` | Resend API key | Yes |
| `EMAIL_FROM` | e.g. `Bold <onboarding@resend.dev>` | Yes |
| `MAX_PLAN_ENABLED` | `false` | Yes |
| `NEXT_PUBLIC_MAX_PLAN_ENABLED` | `false` | Yes |

---

## 3. Architecture confirmation

| Rule | Implementation |
|------|----------------|
| No Bold-owned channel | Per-user OAuth; `youtube_accounts.userId` + `channelId` |
| User-level Google auth | `GET /youtube/connect` embeds Bold `userId` in state |
| Connect before meeting | Settings → Integrations |
| Go Live in meeting | More → **Go Live on YouTube** |
| No stream key / RTMP in UI | OAuth API creates ingest server-side; encrypted in DB |
| No manual title/description | Auto from meeting title + host name |
| Visibility | Public / Unlisted / Private only |
| Activation messaging | 24-hour notice + YouTube Studio link |
| Pro limits | 1 channel, 1 destination |
| Max disabled | `MAX_PLAN_ENABLED=false` |

---

## 4. Pre-merge / pre-deploy gates

- [ ] Railway billing active on project `triumphant-adaptation`
- [ ] All API `YOUTUBE_*` variables set and verified
- [ ] Google redirect URI matches `YOUTUBE_REDIRECT_URI` exactly
- [ ] OAuth consent allows target users (published or test users added)
- [ ] `ENCRYPTION_KEY` set and stable on API
- [ ] PR merged and Railway deploy succeeded
- [ ] API logs show `Applying database migrations…`

---

## 5. Post-deploy smoke tests

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | OTP login | Email received, session created |
| 2 | Settings → Integrations | Page loads for Pro user |
| 3 | Connect YouTube | Google OAuth → channel listed |
| 4 | Activation state | If not enabled: 24h message + Studio link; account still saved |
| 5 | Check again / Go Live modal | After YouTube enables live: eligibility refreshes automatically |
| 6 | More → Go Live on YouTube | Modal: channel + visibility only |
| 7 | Start stream | LIVE indicator; watch URL works; no RTMP/key in network tab |
| 8 | Stop stream | Broadcast ends cleanly |
| 9 | Second user | Different Google account connects independently |

---

## 6. Rollback

If YouTube OAuth or streaming fails after deploy:

1. Revert merge on `main` or redeploy previous Railway image
2. OAuth tokens remain in DB — no data loss
3. Users can reconnect after fix
