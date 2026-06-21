# BoldMeet V1 — Final Launch Report

**Commit target:** latest on `main`  
**Production:** Web `https://bold.robozant.com` · API `https://boldmeetapi-production.up.railway.app`

---

## 1. Fully implemented

### Meetings (Phase 1)
- JaaS JWT architecture — host/co-host moderator via token; production blocks media without JWT
- Jitsi anti-login embed config (no Jitsi auth UI)
- Host transfer, co-host assign/remove
- Bold chat (socket-only, no duplicate optimistic messages)
- Raise hand sync (socket + DB + participant panel)
- Six reactions: 👍 ❤️ 👏 🎉 😂 🙌
- Reconnect loop fix

### Plans & pricing (Phases 2–4)
- Free (₹0) and Pro (₹299) plan definitions + permission matrix
- Landing pricing section with comparison table
- App sidebar: Dashboard, Meetings, Recordings, Billing, Settings
- Dashboard upgrade banner + plan badge
- Billing summary page with usage

### V1 monetization (Phase 5)
- `pending_payments` table
- Upgrade to Pro page (`/billing/upgrade`) with Early Founder Pricing badge
- Razorpay Payment Link flow (static link or API-created link)
- Payment success / cancelled pages
- Admin payments page — manual Pro activation
- Upgrade modals + CTAs throughout app

### Feature gating (Phase 6)
- Free vs Pro enforced on co-hosts, webinar mode, YouTube Live, recordings

### YouTube foundation (Phase 7)
- OAuth connect/callback/disconnect API
- Encrypted token storage
- Stream start/stop API (Pro-gated, feature-flagged UI)

### Roadmap (Phase 8)
- Public `/roadmap` with Available now / Q3 / Q4 sections
- Feature voting (DB-backed) with vote counts
- Pro upgrade CTA with founder pricing

### Legal (Phase 9)
- `/privacy`, `/terms`, `/refund`, `/contact`

---

## 2. Partially implemented

| Feature | Status |
|---------|--------|
| Automatic Pro activation after Razorpay pay | Manual admin activation (by design for V1) |
| Razorpay webhook | Not built — admin verifies in dashboard |
| YouTube OAuth UI in settings | API only |
| YouTube Live in meetings | Behind `NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE` |
| Recordings library playback | Gated placeholder page |
| Chat persistence to DB | Realtime only (`ChatMessage` model unused) |
| Attendee comments / reports | Marketing + Pro flags only |

---

## 3. Pending (post-launch)

- Automated Razorpay webhook → auto Pro upgrade
- YouTube settings “Connect channel” UI
- Recording library with stored assets
- AI summary / transcript
- Full webinar product
- Custom branding UI
- Meeting analytics dashboard

---

## 4. Required credentials

### JaaS (mandatory for production meetings)

| Variable | Service |
|----------|---------|
| `JITSI_JAAS=true` | API |
| `JITSI_APP_ID` | API — App ID from jaas.8x8.vc |
| `JITSI_API_KEY_ID` | API — API Key ID (`kid`) |
| `JITSI_APP_SECRET` | API — RSA private key PEM |
| `NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc` | Web |

### Razorpay (mandatory for payments)

| Variable | Service |
|----------|---------|
| `RAZORPAY_PRO_PAYMENT_LINK` | API — pre-created Payment Link URL (simplest) |
| **OR** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | API — dynamic link creation |

Configure Razorpay callback URL: `https://bold.robozant.com/billing/success`

### Google OAuth — BoldMeet login (optional)

| Variable | Service |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Web |
| `GOOGLE_CLIENT_SECRET` | Web |
| Redirect: `https://bold.robozant.com/api/auth/callback/google` | Google Console |

### YouTube OAuth (optional, Pro)

| Variable | Service |
|----------|---------|
| `YOUTUBE_CLIENT_ID` | API |
| `YOUTUBE_CLIENT_SECRET` | API |
| `YOUTUBE_REDIRECT_URI` | `https://boldmeetapi-production.up.railway.app/youtube/callback` |

### Core Railway env (mandatory)

**API:** `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NODE_ENV=production`, `CORS_ORIGIN`, `FRONTEND_URL`, JaaS vars

**Web:** `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `JWT_SECRET`, `NEXTAUTH_URL`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_JITSI_DOMAIN`

### First admin user

Set in Postgres: `UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';`

---

## A. Mandatory for launch

1. PostgreSQL + auth secrets (both services)
2. JaaS credentials (all four API vars + web domain)
3. `RAZORPAY_PRO_PAYMENT_LINK` (or Razorpay API keys)
4. Railway redeploy from latest `main`

## B. Optional at launch

- Google Sign-In
- YouTube OAuth
- Resend email OTP
- `NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE=true`

## C. Free tiers

| Service | Free tier |
|---------|-----------|
| Railway | ~$5/mo credit (Hobby) |
| 8x8 JaaS | ~25 MAU |
| Razorpay | Pay per transaction |
| Google OAuth | Free |

## D. Monthly cost estimate (INR)

| Users | Estimate |
|-------|----------|
| 10 | ₹0 – ₹500 |
| 100 | ₹2,000 – ₹5,000 |
| 500 | ₹15,000 – ₹40,000 |
| 1000 | ₹35,000 – ₹80,000 |

---

## Launch checklist

- [ ] Deploy latest `main` to Railway (Web + API)
- [ ] Run migrations (`prisma migrate deploy` on API start)
- [ ] Set JaaS env vars on API
- [ ] Set `NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc` on Web
- [ ] Set `RAZORPAY_PRO_PAYMENT_LINK` on API
- [ ] Set yourself as ADMIN in database
- [ ] Test: signup → meeting (no Jitsi login) → upgrade → pay → admin activate Pro
- [ ] Verify `/roadmap`, `/privacy`, `/terms`, `/billing/upgrade` on production

---

## What to send next (priority)

1. **JaaS App ID**
2. **JaaS API Key ID**
3. **JaaS RSA private key (PEM)**
4. **Razorpay Payment Link URL** (or Key ID + Secret)
5. Your admin email (to grant ADMIN role)
