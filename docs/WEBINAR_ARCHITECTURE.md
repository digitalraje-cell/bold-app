# Bold — Webinar Architecture (Future)

> **Status:** Architecture only. No UI or feature implementation yet.

## Two product modes

| Mode | Description | Status |
|------|-------------|--------|
| **Live Meeting** | Real-time Jitsi meetings | Implemented (MVP) |
| **Evergreen Webinar** | Pre-recorded or scheduled webinar replays | Architecture prep |

Both modes share: RBAC, subscription limits, invite system, moderation primitives.

---

## Evergreen webinar capabilities (planned)

### Recorded video source (provider-based)

```typescript
enum VideoSourceProvider {
  YOUTUBE      // Initial provider
  BOLD_VIDEO   // Future Bold Video Platform
}
```

Do **not** couple video source to YouTube directly — use `VideoSourceProvider` abstraction (mirrors recording provider pattern).

### Unlimited attendees (subscription-configurable)

```typescript
webinar.attendeeLimit // resolved from host's plan, not hardcoded
```

Future plan tiers: 500 → 1000 → 5000 → unlimited.

### Multiple start/end schedules

```
Webinar
  └── WebinarSchedule[] (one-to-many)
        ├── startsAt
        ├── endsAt
        └── recurrenceRule (optional, for daily/weekend patterns)
```

Examples supported by schema:
- Single session: tomorrow 8 PM – 10 PM
- Multiple sessions: tomorrow 8 PM AND 10 PM
- Recurring: daily 7 PM (via `recurrenceRule` — parser deferred)

### Pre-assigned moderators

```
WebinarModerator
  ├── email (required)
  ├── userId (linked when user exists)
  └── role: MODERATOR | CO_MODERATOR
```

Host assigns `moderator@email.com` before webinar starts. On join, moderator receives permissions automatically — no repeated approval.

### Future moderator permissions

- Moderate chat
- Remove attendees
- Highlight messages
- Manage Q&A
- Admit participants

Uses same RBAC layer as meeting co-hosts, extended with `ParticipantRole.MODERATOR`.

### Future chat architecture

```typescript
enum WebinarChatModerationMode {
  NONE   // No moderation
  HUMAN  // Human moderators only
  AI     // AI auto-replies
  HYBRID // AI + human oversight
}
```

Not implemented. Schema and service placeholders prepared.

---

## Database schema

| Model | Purpose |
|-------|---------|
| `Webinar` | Core webinar entity |
| `WebinarSchedule` | Multiple start/end times |
| `WebinarModerator` | Pre-assigned moderators by email |
| `RecordingSession` | Provider-agnostic recording tracking |

See `apps/api/prisma/schema.prisma`.

---

## Services (placeholders)

| Service | Path | Status |
|---------|------|--------|
| `WebinarService` | `apps/api/src/webinar/` | Throws `NotImplementedException` |
| `GET /api/webinars/status` | Returns architecture readiness info | Active |

---

## Recording provider abstraction (shared with meetings)

See `packages/shared/src/recording/types.ts` and `apps/api/src/recording/`.

```
RecordingProvider (interface)
  ├── YouTubeRecordingProvider
  ├── BoldVideoRecordingProvider (placeholder)
  └── StorageRecordingProvider (placeholder)
```

Webinar recorded video will use the same provider registry when implemented.

---

## Implementation phases (future)

1. Webinar CRUD API + dashboard UI
2. Schedule management UI
3. Moderator pre-assignment flow
4. Evergreen replay room (video + live chat)
5. Attendee registration + quota enforcement
6. Chat moderation (human → hybrid AI)
