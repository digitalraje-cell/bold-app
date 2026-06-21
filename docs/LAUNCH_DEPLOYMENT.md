# BoldMeet V1 Launch — Deployment & Credentials Guide

Production URLs (current):

- Web: `https://bold.robozant.com`
- API: `https://boldmeetapi-production.up.railway.app`

---

## A. Credentials you may need

### JaaS (8x8) — silent Jitsi moderator via JWT

| Variable | Service | Description |
|----------|---------|-------------|
| `JITSI_JAAS` | API | Set to `true` for 8x8 JaaS |
| `JITSI_APP_ID` | API | JaaS App ID (`vpaas-magic-cookie-…`) |
| `JITSI_API_KEY_ID` | API | API Key ID (`kid` in JWT header) |
| `JITSI_PRIVATE_KEY` | API | RSA private key PEM (alias: `JITSI_APP_SECRET`) |
| `NEXT_PUBLIC_JITSI_DOMAIN` | Web | `8x8.vc` |

Without these, **production meetings return 503** for media (by design — no public Jitsi login screens).

### BoldMeet core auth & database

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API + Web | PostgreSQL connection string |
| `JWT_SECRET` / `AUTH_SECRET` | API + Web | Session/JWT signing |
| `ENCRYPTION_KEY` | API | Encrypts passcodes, YouTube tokens, stream keys |
| `CORS_ORIGIN` | API | `https://bold.robozant.com` |
| `FRONTEND_URL` | API | `https://bold.robozant.com` |
| `API_URL` | Web | Server-side proxy to Nest API |
| `NEXT_PUBLIC_API_URL` | Web | Browser API base (or use `/api/backend` proxy) |
| `NEXT_PUBLIC_SOCKET_URL` | Web | Socket.IO origin (usually same as API) |
| `NEXTAUTH_URL` / `AUTH_URL` | Web | `https://bold.robozant.com` |

### Email OTP (BoldMeet login — required for production)

| Variable | Service | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | Web | [Resend](https://resend.com) API key |
| `EMAIL_FROM` | Web | Verified sender address |
| `OTP_EXPIRY_MINUTES` | Web | Default `10` |

Without Resend in production, OTP codes only appear in server logs (dev mode).

### YouTube RTMP relay (Pro — optional)

| Variable | Service |
|----------|---------|
| `YOUTUBE_CLIENT_ID` | API |
| `YOUTUBE_CLIENT_SECRET` | API |
| `YOUTUBE_REDIRECT_URI` | API | e.g. `https://boldmeetapi-production.up.railway.app/youtube/callback` |
| `NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE` | Web | Set `true` when ready to expose live UI |

### Razorpay (Pro checkout — ₹299/month)

| Variable | Service |
|----------|---------|
| `RAZORPAY_KEY_ID` | API |
| `RAZORPAY_KEY_SECRET` | API |
| `RAZORPAY_WEBHOOK_SECRET` | API | For subscription activation webhooks |

### Email OTP (optional)

| Variable | Service |
|----------|---------|
| `RESEND_API_KEY` | Web |
| `EMAIL_FROM` | Web |

---

## B. Mandatory for launch (minimum viable)

1. **PostgreSQL** — `DATABASE_URL` on API and Web
2. **Auth secrets** — `JWT_SECRET`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`
3. **Railway web env** — `NEXT_PUBLIC_APP_URL`, `API_URL`, `NEXTAUTH_URL`, `AUTH_URL`
4. **Railway API env** — `CORS_ORIGIN`, `FRONTEND_URL`, `PORT`, `NODE_ENV=production`
5. **JaaS credentials** — all four JaaS vars above (required for production meetings without moderator/login UI)

You can launch **Free plan meetings** with only the above. Pro features show upgrade UI until Razorpay is wired.

---

## C. Optional — add later

| Credential | When to add |
|------------|-------------|
| Razorpay | When you want live Pro payments |
| YouTube OAuth | When Pro users should connect channels via OAuth |
| `NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE=true` | When RTMP relay is tested in prod |
| Resend | When email OTP should leave dev console mode |
| Self-hosted Jitsi | Alternative to JaaS at scale |

---

## D. Free tiers

| Service | Free tier | Notes |
|---------|-----------|-------|
| **Railway** | $5 credit/month (Hobby) | API + Web + Postgres |
| **8x8 JaaS** | ~25 MAU free | Enough for early beta |
| **Vercel** | Hobby free | Alternative to Railway for Next.js |
| **Resend** | 3k emails/month | Production OTP email |
| **Razorpay** | No monthly fee | Pay per transaction (~2%) |

---

## Phase 8 — Zero-budget first launch

### Minimum required services

1. Railway (Web + API + Postgres) — or Vercel (web) + Railway (API + DB)
2. 8x8 JaaS free tier
3. Domain you already own (`bold.robozant.com`)

### Expected monthly cost

| Scale | Est. cost | Notes |
|-------|-----------|-------|
| **10 users** | **₹0–₹500** | JaaS free, Railway hobby credit covers light usage |
| **100 users** | **₹2,000–₹5,000** | JaaS may need paid tier; Railway usage grows |
| **500 users** | **₹15,000–₹40,000** | JaaS MAU pricing, larger DB, possible dedicated relay |

### Recommended upgrade path as revenue grows

1. **0 → 50 paying users** — Stay on JaaS free + Railway hobby; enable Razorpay
2. **50 → 200 users** — JaaS paid MAU; Resend for OTP; monitor Postgres size
3. **200+ users** — Consider self-hosted Jitsi or JaaS enterprise; Redis for sockets; CDN for static assets
4. **Pro revenue covers infra** — Enable YouTube OAuth + live relay; add recording storage (S3/R2)

---

## Railway environment checklist

### `@boldmeet/api`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
ENCRYPTION_KEY=...
CORS_ORIGIN=https://bold.robozant.com
FRONTEND_URL=https://bold.robozant.com
NODE_ENV=production
JITSI_JAAS=true
JITSI_APP_ID=vpaas-magic-cookie-...
JITSI_API_KEY_ID=...
JITSI_APP_SECRET="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# Optional:
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=https://boldmeetapi-production.up.railway.app/youtube/callback
```

### `@boldmeet/web`

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXTAUTH_SECRET=...
JWT_SECRET=...
NEXTAUTH_URL=https://bold.robozant.com
AUTH_URL=https://bold.robozant.com
NEXT_PUBLIC_APP_URL=https://bold.robozant.com
API_URL=https://boldmeetapi-production.up.railway.app
NEXT_PUBLIC_API_URL=https://boldmeetapi-production.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://boldmeetapi-production.up.railway.app
NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc
NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE=false
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Post-deploy launch checklist

- [ ] Run `pnpm db:migrate:deploy` on API (or Railway start command includes migrate)
- [ ] Set all **mandatory** env vars on API and Web
- [ ] Sign up → verify → create instant meeting
- [ ] Host joins: **no** Jitsi login, **no** “Become moderator”
- [ ] Guest joins: chat, reactions (6), raise hand, screen share
- [ ] Host transfer and co-host (Pro) / upgrade modal (Free)
- [ ] Landing page pricing section loads on mobile
- [ ] Billing page shows Free plan + usage
- [ ] Recordings page shows Pro gate for Free users

---

## What to send next (priority order)

**Send these first (blocking production meetings):**

1. JaaS App ID
2. JaaS API Key ID (`kid`)
3. JaaS RSA private key (PEM)

**Send when ready for payments:**

4. Razorpay Key ID + Secret

**Send when ready for YouTube OAuth:**

5. Google Cloud OAuth client (YouTube Data API v3 + Live Streaming enabled)
6. Redirect URI registered: `https://boldmeetapi-production.up.railway.app/youtube/callback`
