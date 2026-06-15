# Bold — Deployment Plan

> **Status:** Ready for review. Do not deploy until approved.

Production domain: **https://bold.hasbrando.com**

---

## Architecture

| Service | Platform | URL |
|---------|----------|-----|
| Frontend (Next.js) | Vercel | `https://bold.hasbrando.com` |
| API + WebSockets (NestJS) | Railway | `https://api.bold.hasbrando.com` (recommended) |
| PostgreSQL | Supabase or Railway Postgres | Private connection string |

---

## 1. Database (Supabase or Railway)

1. Create a PostgreSQL project
2. Copy the connection string (`DATABASE_URL`)
3. Run migrations from CI or locally against production DB:

```bash
cd apps/api
DATABASE_URL="postgresql://..." pnpm db:migrate
```

---

## 2. Backend (Railway)

**Important (monorepo):** Set the Railway service **Root Directory to `/`** (repo root), **not** `apps/api`.  
If Root Directory is `apps/api`, npm runs instead of pnpm and `workspace:*` dependencies fail.

**Config-as-code path:** `/apps/api/railway.toml`

**Build command (via railway.toml):**
```bash
bash scripts/railway-build-api.sh
# runs: pnpm install --frozen-lockfile && pnpm build:api
```

**Start command:**
```bash
bash scripts/railway-start-api.sh
# runs: pnpm start:api → node dist/main.js
```

**Health check:** `GET /api/health`

### Required environment variables

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...` | Supabase/Railway Postgres |
| `JWT_SECRET` | random 32+ chars | Must match frontend auth secret strategy |
| `AUTH_SECRET` | same as JWT or separate | Used as JWT fallback |
| `ENCRYPTION_KEY` | 32-char key | Meeting passcode encryption |
| `CORS_ORIGIN` | `https://bold.hasbrando.com` | Comma-separated; also accepts `AUTH_URL` / `NEXTAUTH_URL` |
| `PORT` | `4000` | Railway sets automatically |
| `NODE_ENV` | `production` | |

### Optional (later phases)

| Variable | Purpose |
|----------|---------|
| `YOUTUBE_CLIENT_ID` | YouTube OAuth |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth |
| `YOUTUBE_REDIRECT_URI` | OAuth callback |
| `JITSI_APP_ID` | Self-hosted Jitsi JWT |
| `JITSI_APP_SECRET` | Self-hosted Jitsi JWT |

---

## 3. Frontend (Vercel)

**Root directory:** `apps/web`

**Framework preset:** Next.js

**Build command:**
```bash
cd ../.. && pnpm install && pnpm --filter @boldmeet/web db:generate && pnpm --filter @boldmeet/web build
```

### Required environment variables

| Variable | Production value |
|----------|------------------|
| `DATABASE_URL` | Same Postgres URL (**required** — credentials login uses Prisma on web) |
| `AUTH_SECRET` | Strong random secret (**required** — Auth.js v5 primary secret) |
| `NEXTAUTH_SECRET` | Same as `AUTH_SECRET` (legacy alias) |
| `AUTH_URL` | `https://bold.hasbrando.com` (must match deployed web URL exactly) |
| `NEXTAUTH_URL` | Same as `AUTH_URL` |
| `JWT_SECRET` | Same as Railway API `JWT_SECRET` |
| `ENCRYPTION_KEY` | Same as API |
| `NEXT_PUBLIC_APP_NAME` | `Bold` |
| `NEXT_PUBLIC_APP_DOMAIN` | `bold.hasbrando.com` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Browser-based meeting platform with YouTube recording` |
| `NEXT_PUBLIC_API_URL` | `https://api.bold.hasbrando.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.bold.hasbrando.com` |
| `NEXT_PUBLIC_JITSI_DOMAIN` | `meet.jit.si` |

### Email OTP (production)

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | SMTP server |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | `Bold <noreply@bold.hasbrando.com>` |
| `SMTP_SECURE` | `false` |
| `OTP_EXPIRY_MINUTES` | `10` |

### Google OAuth (optional)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Google sign-in |

---

## 4. DNS

| Record | Type | Value |
|--------|------|-------|
| `bold.hasbrando.com` | CNAME | Vercel target |
| `api.bold.hasbrando.com` | CNAME | Railway target |

---

## 5. Post-deploy verification

- [ ] `https://bold.hasbrando.com` loads landing page
- [ ] Signup + OTP verification works
- [ ] Verified user can create meeting
- [ ] Meeting link uses production domain
- [ ] `https://api.bold.hasbrando.com/api/health` returns `{ status: "ok" }`
- [ ] WebSocket connects from production frontend
- [ ] Jitsi video/audio works in browser
- [ ] Invite modal copies correct production URL

---

## 6. Security checklist

- [ ] All secrets stored in platform env vars (never committed)
- [ ] `AUTH_SECRET`, `JWT_SECRET`, `ENCRYPTION_KEY` are unique and strong
- [ ] CORS restricted to production frontend origin
- [ ] HTTPS enforced on both domains
- [ ] Database not publicly accessible without credentials

---

## 7. Rollback plan

- Vercel: redeploy previous successful deployment
- Railway: rollback to previous deployment
- Database: restore Supabase/Railway backup if migration fails

---

## Approval required before deployment

Reply with approval to proceed, or request changes to this plan.
