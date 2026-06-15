# Bold — Development Roadmap

## Phase 1: Project Foundation ✅
**Goal:** Monorepo setup, tooling, database schema, Docker

- [x] Planning documents
- [ ] Git init + .gitignore
- [ ] pnpm monorepo (web + api + shared)
- [ ] Next.js app with Tailwind
- [ ] NestJS API scaffold
- [ ] Prisma schema + migrations
- [ ] Docker Compose (PostgreSQL)
- [ ] Shared types package
- [ ] Environment config
- [ ] README

**Commit:** `feat: initialize Bold monorepo with Next.js, NestJS, and Prisma`

---

## Phase 2: Authentication & User Management
**Goal:** Secure signup/login, Google OAuth, protected routes

- [ ] NextAuth.js v5 setup (email + Google)
- [ ] Login / Signup pages
- [ ] Session management
- [ ] Protected route middleware
- [ ] User profile API (NestJS)
- [ ] Profile settings page
- [ ] Auth guards on API

**Commit:** `feat: add authentication with NextAuth, Google OAuth, and protected routes`

---

## Phase 3: Dashboard & Meeting CRUD
**Goal:** Create, schedule, list meetings

- [ ] Meeting CRUD API (NestJS)
- [ ] Meeting settings defaults on creation
- [ ] Dashboard page (upcoming, live, past)
- [ ] Create meeting form with feature toggles
- [ ] Schedule meeting with date/time
- [ ] Instant meeting
- [ ] Join by meeting code
- [ ] Meeting detail page
- [ ] Password-protected meetings

**Commit:** `feat: add meeting CRUD, dashboard, and scheduling`

---

## Phase 4: Meeting Room & Jitsi Integration
**Goal:** Browser-based video meetings with Jitsi

- [ ] Lobby screen (pre-join)
- [ ] Jitsi External API integration
- [ ] Meeting room page
- [ ] Controls bar (mic, cam, share, leave)
- [ ] Socket.io gateway setup
- [ ] Participant join/leave sync
- [ ] Fullscreen immersive mode
- [ ] Grid / speaker view (via Jitsi)

**Commit:** `feat: integrate Jitsi Meet with meeting room and controls`

---

## Phase 5: Real-time Meeting Features
**Goal:** Chat, reactions, raise hand, waiting room, participants panel

- [ ] Socket.io chat (everyone + host-only modes)
- [ ] Reactions system with overlay
- [ ] Raise hand queue + host actions
- [ ] Waiting room (admit/reject/admit all)
- [ ] Participants panel with RBAC controls
- [ ] Host moderation (mute, remove, co-host, transfer)
- [ ] Feature toggles during meeting
- [ ] Auto mute on join

**Commit:** `feat: add real-time chat, reactions, raise hand, and waiting room`

---

## Phase 6: YouTube Integration
**Goal:** User-owned live streaming and recording

- [ ] YouTube OAuth connect/disconnect
- [ ] Encrypted token storage
- [ ] Live streaming eligibility check
- [ ] Create YouTube live broadcast on stream start
- [ ] Stream to user's YouTube channel
- [ ] Recording visibility settings
- [ ] Stream controls in meeting UI
- [ ] YouTube settings page

**Commit:** `feat: add YouTube live streaming and recording integration`

---

## Phase 7: Polish & Production Readiness
**Goal:** UI polish, error handling, deployment config

- [ ] Dark/light mode
- [ ] Loading & empty states
- [ ] Error boundaries
- [ ] Responsive polish
- [ ] Meeting analytics basics
- [ ] Rate limiting
- [ ] Deployment configs (Vercel + Railway)
- [ ] Final README with setup instructions

**Commit:** `feat: polish UI, add dark mode, and deployment configuration`

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1 | 1 session | Day 1 |
| Phase 2 | 1 session | Day 1-2 |
| Phase 3 | 1 session | Day 2 |
| Phase 4 | 1-2 sessions | Day 2-3 |
| Phase 5 | 1-2 sessions | Day 3-4 |
| Phase 6 | 1 session | Day 4-5 |
| Phase 7 | 1 session | Day 5 |

---

## Success Criteria (MVP)

1. User can sign up, log in (email + Google)
2. User can create instant or scheduled meetings
3. User can join meetings via browser link
4. Video/audio works in browser via Jitsi
5. Host can control participants (mute, remove, co-host)
6. Chat, reactions, raise hand work in real-time
7. Waiting room functions correctly
8. Fullscreen immersive mode works
9. Host can stream/record to their own YouTube
10. Feature toggles work at creation and during meeting
