# Bold — Testing Checklists

## Local testing checklist

### Auth & verification
- [ ] Sign up with email/password
- [ ] OTP logged to console in dev (or received via SMTP)
- [ ] Verify account at `/verify`
- [ ] Verified badge appears on dashboard
- [ ] Unverified user blocked from `/meetings/create`
- [ ] Google OAuth auto-verifies (if configured)

### Meetings
- [ ] Create instant meeting (verified user)
- [ ] Create scheduled meeting with passcode
- [ ] Join via lobby `/meeting/[id]`
- [ ] Waiting room admits/rejects participants
- [ ] Locked meeting rejects new joiners
- [ ] Participant limit enforced

### Meeting room
- [ ] Camera/mic toggle works
- [ ] Screen share works
- [ ] Chat panel sends messages
- [ ] Reactions appear temporarily
- [ ] Raise hand emits socket event
- [ ] Fullscreen enters/exits smoothly (ESC + button)
- [ ] Invite modal copies link with correct domain

### Host controls
- [ ] Invite modal shows topic, link, ID, passcode
- [ ] Copy invite / copy link works
- [ ] Email + WhatsApp invite links open correctly
- [ ] Host can end meeting

---

## Online testing checklist (production)

Use **bold.hasbrando.com** after deployment approval.

### Setup
- [ ] Two devices ready (laptop + phone recommended)
- [ ] Different networks if possible (Wi‑Fi + mobile data)
- [ ] Chrome, Safari, or Edge installed on both

### Multi-user join
1. [ ] Host creates meeting on laptop
2. [ ] Copy invite link from Invite modal
3. [ ] Guest opens link on phone (different browser/network)
4. [ ] Both enter meeting room with video/audio
5. [ ] Confirm both see/hear each other via Jitsi

### Roles & permissions
- [ ] Unverified guest can join but not host
- [ ] Verified host can create and invite
- [ ] Co-host moderation (when assigned)
- [ ] Participant has limited controls

### Invite flow
- [ ] Copy invite text includes production URL
- [ ] WhatsApp share opens with formatted message
- [ ] Email invite opens mail client with subject/body
- [ ] Passcode-protected meeting requires passcode on join

### Waiting room
- [ ] Enable waiting room on meeting creation
- [ ] Guest lands in waiting screen
- [ ] Host admits guest from waiting room

### Fullscreen & mobile
- [ ] Fullscreen works on desktop (Chrome, Safari, Firefox, Edge)
- [ ] Mobile browser join works (portrait + landscape)
- [ ] Controls bar usable on small screens
- [ ] Exit fullscreen button visible in immersive mode

### Stability
- [ ] 3+ participants join simultaneously
- [ ] Reconnect after brief network drop
- [ ] Leave/end meeting cleans up session
- [ ] No console errors on join/leave

---

## Browser compatibility matrix

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | Required | Required |
| Safari | Required | Required |
| Edge | Recommended | — |
| Firefox | Recommended | — |

---

## Known dev-mode notes

- OTP codes print to server console when `SMTP_HOST` is not set
- Jitsi uses public `meet.jit.si` unless self-hosted
- WebSocket must reach the API origin configured in `NEXT_PUBLIC_SOCKET_URL`
