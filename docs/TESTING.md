# Bold — Testing Checklists

> Complete this checklist **before deployment approval**.

## Local testing checklist

### Auth & verification
- [ ] Sign up with email/password
- [ ] OTP logged to console in dev (or received via SMTP)
- [ ] Verify account at `/verify`
- [ ] Verified badge appears on dashboard
- [ ] Unverified user blocked from `/meetings/create`
- [ ] Google OAuth auto-verifies (if configured)

### Subscription & freemium gating
- [ ] `GET /api/subscriptions/me` returns FREE plan + limits
- [ ] Free user: attendee limit = 100
- [ ] Free user: cannot access YouTube/recording endpoints (403)
- [ ] Free user: can use chat, reactions, raise hand, waiting room, invite
- [ ] Co-host limit enforced (max 1 on FREE plan)
- [ ] Permission checks use keys, not hardcoded plan names

### Meetings
- [ ] Create instant meeting (verified user)
- [ ] Create scheduled meeting with passcode
- [ ] Join via lobby `/meeting/[id]`
- [ ] Waiting room admits/rejects participants
- [ ] Locked meeting rejects new joiners
- [ ] Participant limit enforced (100 on free plan)

### Meeting duration (free plan)
- [ ] `GET /api/meetings/:id/duration` returns limit info
- [ ] Grace period warning appears after 60 minutes (or simulate with adjusted `startedAt`)
- [ ] Expired modal: "Your free meeting time has ended. Upgrade to continue unlimited meetings."
- [ ] Meeting ends gracefully after grace period

### Meeting room
- [ ] Camera/mic toggle works
- [ ] Screen share works
- [ ] Chat panel sends messages
- [ ] Reactions appear temporarily
- [ ] Raise hand emits socket event
- [ ] Fullscreen enters/exits smoothly (ESC + button)
- [ ] Invite modal copies link with correct domain

### Host / co-host permissions
- [ ] Host can mute, remove, make co-host, transfer host
- [ ] Co-host can moderate when enabled
- [ ] Participant has limited controls
- [ ] Invite modal shows topic, link, ID, passcode
- [ ] Copy invite / copy link / email / WhatsApp work

### Architecture endpoints (smoke test)
- [ ] `GET /api/recording/providers` — returns provider list (403 on free plan)
- [ ] `GET /api/webinars/status` — returns architecture readiness message

---

## Pre-deployment verification (required)

Run all items below before requesting deployment:

1. [ ] `pnpm build` succeeds (web + api)
2. [ ] `pnpm db:migrate` applies cleanly
3. [ ] Meeting join works locally (2 browsers)
4. [ ] Invite flow works (copy link + passcode)
5. [ ] Host/co-host permissions work
6. [ ] 100 attendee limit config exists on FREE plan
7. [ ] Subscription gating returns 403 for YouTube on FREE
8. [ ] Verification flow works end-to-end
9. [ ] Duration limit API responds correctly

---

## Online testing checklist (production)

Use **bold.hasbrando.com** after deployment approval.

### Setup
- [ ] Laptop + phone on different networks
- [ ] Chrome and Safari tested
- [ ] Multiple participants (3+)

### Multi-user scenarios
1. [ ] Host creates meeting → invite link → guest joins from phone
2. [ ] Video/audio works between participants
3. [ ] Host transfer works
4. [ ] Co-host can mute/admit from waiting room
5. [ ] Raise hand + reactions visible
6. [ ] Waiting room admit/reject flow
7. [ ] Invite copy includes `https://bold.hasbrando.com/meeting/...`
8. [ ] Free plan duration limit modal (if testable)
9. [ ] Attendee limit blocks join at capacity

### Fullscreen & mobile
- [ ] Fullscreen on Chrome, Safari, Firefox, Edge
- [ ] Mobile join (portrait + landscape)
- [ ] Exit fullscreen button + ESC key

---

## Browser compatibility matrix

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | Required | Required |
| Safari | Required | Required |
| Edge | Recommended | — |
| Firefox | Recommended | — |

---

## Dev-mode notes

- OTP codes print to server console when `SMTP_HOST` is unset
- Jitsi uses `meet.jit.si` by default
- WebSocket must reach `NEXT_PUBLIC_SOCKET_URL`
- To test duration limit quickly: temporarily set `maxMeetingDurationMinutes: 1` in FREE plan definition
