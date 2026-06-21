# BoldMeet V1 — Final Launch Checklist

Production URLs:

- Web: `https://bold.robozant.com`
- API: `https://boldmeetapi-production.up.railway.app`

---

## 1. Authentication flow (Email OTP only)

```mermaid
sequenceDiagram
  participant User
  participant Web as BoldMeet Web
  participant Email as Resend
  participant DB as PostgreSQL

  User->>Web: Enter email on /login
  Web->>DB: Create OTP record (10 min expiry)
  Web->>Email: Send 6-digit code
  User->>Web: Enter OTP
  Web->>DB: Verify OTP, create user if new
  Web->>User: NextAuth JWT session (30 days)
  Note over User,Web: Host must be logged in to create meetings
  Note over User,Web: Guests join with name only (no account)
```

**Not supported in V1:** passwords, Google login, social login, forgot/reset password.

---

## 2. Required credentials (you must provide)

| # | Credential | Where to set | How to obtain |
|---|------------|--------------|---------------|
| 1 | **JaaS App ID** | API: `JITSI_APP_ID` | [8x8 JaaS Console](https://jaas.8x8.vc/) → your app → App ID (`vpaas-magic-cookie-…`) |
| 2 | **JaaS API Key ID** | API: `JITSI_API_KEY_ID` | JaaS Console → API Keys → Key ID (`kid` for JWT header) |
| 3 | **JaaS Private Key** | API: `JITSI_PRIVATE_KEY` | JaaS Console → API Keys → download RSA private key PEM. Alias: `JITSI_APP_SECRET` |
| 4 | **Razorpay Payment Link URL** | API: `RAZORPAY_PRO_PAYMENT_LINK` | [Razorpay Dashboard](https://dashboard.razorpay.com/) → Payment Links → create ₹299/month link |
| 5 | **Admin Email** | PostgreSQL (manual) | After first OTP login: `UPDATE users SET role = 'ADMIN' WHERE email = 'you@company.com';` |

### JaaS setup (step by step)

1. Sign up at **https://jaas.8x8.vc/**
2. Create a JaaS application
3. Copy **App ID** → `JITSI_APP_ID`
4. Generate an **API Key** → copy **Key ID** → `JITSI_API_KEY_ID`
5. Download the **RSA private key** (PEM) → `JITSI_PRIVATE_KEY`  
   - Paste full PEM in Railway env, or base64-encode with `\n` for newlines
6. Set on **API service**:
   ```
   JITSI_JAAS=true
   JITSI_APP_ID=vpaas-magic-cookie-xxxxxxxx
   JITSI_API_KEY_ID=your-key-id
   JITSI_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
   ```
7. Set on **Web service**:
   ```
   NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc
   NEXT_PUBLIC_MEDIA_PROVIDER=jitsi
   ```

Without JaaS credentials, **production meetings return 503** (by design — users never see Jitsi login screens).

---

## 3. Email provider (Resend) — required for production OTP

| Variable | Service | Notes |
|----------|---------|-------|
| `RESEND_API_KEY` | Web | [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | Web | Verified sender, e.g. `BoldMeet <noreply@yourdomain.com>` |
| `OTP_EXPIRY_MINUTES` | Web | Default `10` |

**Dev behaviour:** if `RESEND_API_KEY` is empty, OTP codes log to the web server console.

**Production behaviour:** OTP emails sent via Resend. Resend free tier: 3,000 emails/month.

---

## 4. Core platform secrets

Set on **both API and Web** (Railway):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | API auth tokens |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | NextAuth session signing |
| `ENCRYPTION_KEY` | API only — encrypts meeting passcodes, stream keys |

Set on **Web**:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://bold.robozant.com` |
| `NEXTAUTH_URL` / `AUTH_URL` | `https://bold.robozant.com` |
| `API_URL` | `https://boldmeetapi-production.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | same as API_URL |
| `NEXT_PUBLIC_SOCKET_URL` | same as API_URL |

Set on **API**:

| Variable | Example |
|----------|---------|
| `CORS_ORIGIN` | `https://bold.robozant.com` |
| `FRONTEND_URL` | `https://bold.robozant.com` |
| `NODE_ENV` | `production` |

---

## 5. Razorpay billing (V1 — manual activation)

1. User clicks **Upgrade to Pro** → redirected to Razorpay Payment Link (₹299)
2. After payment → `/billing/success` → pending payment recorded
3. Admin verifies payment in Razorpay dashboard
4. Admin activates Pro at `/admin/payments` or `/admin/users`

**Optional:** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` for dynamic payment link creation (instead of static link).

**Not in V1:** Razorpay webhooks, automatic subscription renewal.

---

## 6. Pre-launch verification checklist

### Authentication
- [ ] `/login` — email → OTP → auto sign-in
- [ ] New user auto-created on first OTP login
- [ ] Session persists after browser refresh (30 days)
- [ ] Sign out works from sidebar and profile settings
- [ ] No Google login button anywhere
- [ ] `/signup` redirects to `/login`

### Meetings (JaaS)
- [ ] Host: OTP login → Start Meeting → camera opens immediately
- [ ] No Jitsi login screen, moderator screen, or "conference not started"
- [ ] Guest: open invite link → enter name → join directly
- [ ] Raise hand works
- [ ] Reactions work (6 options)
- [ ] Chat appears once (no duplicate windows)
- [ ] Screen share works
- [ ] Reconnect after network drop

### Plans & billing
- [ ] Free user sees upgrade modals for Pro features (co-host, YouTube Live)
- [ ] Pro user can use co-hosts after admin activation
- [ ] Payment link redirects correctly
- [ ] Success page shows activation pending message
- [ ] Admin can activate/deactivate Pro

### Pages
- [ ] Landing pricing section (Free ₹0, Pro ₹299)
- [ ] `/roadmap` with Coming Soon + Pro labels
- [ ] `/privacy`, `/terms`, `/refund`, `/contact`
- [ ] Sidebar: Dashboard, Meetings, Billing, Roadmap, Settings

---

## 7. Free vs paid services

| Service | V1 cost | Notes |
|---------|---------|-------|
| **Railway** (Web + API + Postgres) | ~$5 credit/month Hobby | Primary hosting |
| **8x8 JaaS** | Free ~25 MAU | Required for production meetings |
| **Resend** | Free 3k emails/month | Production OTP email |
| **Razorpay** | No monthly fee | ~2% per transaction |
| **Domain** | Your existing cost | `bold.robozant.com` |
| **YouTube OAuth** | Free | Optional — Pro RTMP relay works with stream key paste |
| **Vercel** | Free Hobby | Alternative to Railway for Next.js |

### Becomes paid later (at scale)

| Service | When |
|---------|------|
| Railway | Beyond hobby credit (~$5–20/mo) |
| 8x8 JaaS | Beyond 25 MAU free tier |
| Resend | Beyond 3k emails/month |
| Postgres | Larger DB on Railway |

---

## 8. Admin bootstrap

After your first OTP login:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

Admin pages:

- `/admin/users` — view users, activate/deactivate Pro
- `/admin/payments` — view pending payments, activate Pro after Razorpay verification

---

## 9. Deploy steps

1. Push latest `main` to GitHub
2. Railway auto-deploys Web + API
3. Set all env vars above on both services
4. Run pending Prisma migrations on API (`prisma migrate deploy`)
5. Grant ADMIN role via SQL
6. Test OTP login on production
7. Test instant meeting with JaaS credentials
8. Test Razorpay payment link → admin activate Pro

---

## 10. What V1 intentionally excludes

- Password authentication
- Google / social login
- Razorpay webhooks / auto-renewal
- Recording library playback
- Webinar mode UI (Pro badge only — coming soon)
- AI summary / transcript
- Enterprise SSO, SAML, audit logs

These can be added post-launch without rewriting core architecture.
