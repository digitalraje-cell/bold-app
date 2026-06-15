# Unified Room Architecture

Bold uses **one unified room system** with runtime mode switching. Meeting and Webinar are not separate products — they are modes of the same room.

## Core principle

```
Discussion (Meeting mode)
    ↓ host switches
Webinar mode (host presentation)
    ↓ bring attendee on stage
    ↓ host switches back
Meeting mode
```

All in the **same room**. No restart. No refresh. No new Jitsi room.

## Room mode

| Field | Location | Values |
|-------|----------|--------|
| `roomMode` | `meetings.roomMode` | `MEETING`, `WEBINAR` |

Host switches via `PATCH /api/meetings/:id/room/mode`. All clients receive `room:mode-changed` over Socket.io.

## Mode behavior

### Meeting mode
- All admitted participants visible
- Audio/video per settings (`participantMicAccess`)
- Grid/gallery (Jitsi)
- Full collaboration: chat, reactions, raise hand, screen share

### Webinar mode
- **Stage visible:** Host, Co-host, Panelist
- **Audience:** hidden from stage, mic OFF, camera OFF by default
- Host can **bring attendee on stage** (selective mic/camera)
- Host can **promote participant → panelist**

Participant fields:

| Field | Purpose |
|-------|---------|
| `isOnStage` | Visible in webinar |
| `micAllowed` | Host-controlled mic permission |
| `cameraAllowed` | Host-controlled camera permission |

## RBAC roles

| Role | Capabilities |
|------|-------------|
| **Host** | Switch mode, transfer host, co-hosts, panelists, stage, chat modes, security |
| **Co-host** | Moderate participants, admit waiting room, bring on stage |
| **Panelist** | Audio, video, chat, screen share (plan/settings) |
| **Participant** | Limited; host-controlled; promotable live |
| **Moderator** | Future evergreen webinar (architecture ready) |
| **Guest** | Join-only baseline |

Role matrix: `packages/shared/src/rbac/roles.ts`

## Chat modes

| Mode | Who can send |
|------|--------------|
| `EVERYONE` | All participants |
| `HOST_ONLY` | Host only |
| `HOST_PANELISTS` | Host, co-hosts, panelists |
| `DISABLED` | Nobody |

Host switches live via `PATCH /api/meetings/:id/room/chat-mode`. Socket event: `chat:mode-changed`.

## Subscription gating

Permissions are **key-based**, not plan-name checks:

```
canSwitchRoomMode, canUsePanelists, canUseEvergreenWebinar,
canAssignModerator, meetingAttendeeLimit, webinarAttendeeLimit, ...
```

Plans: `FREE`, `STARTER`, `PRO`, `BUSINESS`, `ENTERPRISE`

Both Meeting and Webinar modes available on FREE — gating is by feature/limit only.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/meetings/:id/room` | Full room state |
| PATCH | `/meetings/:id/room/mode` | Switch Meeting ↔ Webinar |
| PATCH | `/meetings/:id/room/chat-mode` | Change chat mode |
| POST | `/meetings/:id/room/participants/:pid/panelist` | Promote to panelist |
| POST | `/meetings/:id/room/participants/:pid/stage` | Bring on stage |
| POST | `/meetings/:id/room/participants/:pid/stage/remove` | Remove from stage |
| PATCH | `/meetings/:id/room/participants/:pid/media` | Mic/camera permissions |

## Socket events

| Event | Payload |
|-------|---------|
| `room:mode-changed` | `{ roomMode, meetingId }` |
| `participant:stage` | `{ participantId, isOnStage, micAllowed, cameraAllowed, ... }` |
| `chat:mode-changed` | `{ chatMode, chatEnabled }` |

## Evergreen webinar (future)

Uses the **same unified room** — no separate webinar codebase. See `docs/WEBINAR_ARCHITECTURE.md`.

The `Webinar` model stores evergreen metadata (schedules, moderators, video source). Live sessions attach to a `Meeting` with `roomMode: WEBINAR`.

## Frontend

- `useRoom` hook — loads state, subscribes to socket, host actions
- `roomStore` (Zustand) — room mode, participants, chat mode
- `RoomModeSwitcher` — host control in meeting room
- `WebinarModeBanner` — audience notice in webinar mode

## Jitsi note

Stage visibility is enforced in Bold's permission layer and UI. Jitsi may still show all tiles until configured with role-based Jitsi commands — future enhancement.
