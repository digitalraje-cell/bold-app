# Bold — Technical Architecture Plan

## Overview

**Bold** is a browser-based Zoom clone MVP built as a monorepo with a Next.js frontend, NestJS API, PostgreSQL database, Socket.io for real-time signaling, and Jitsi Meet Open Source for WebRTC media.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│  Next.js App Router │ Tailwind │ Zustand │ Jitsi External API    │
└────────────┬───────────────────────────────┬────────────────────┘
             │ HTTPS/REST                     │ WebSocket
             ▼                                ▼
┌────────────────────────┐      ┌─────────────────────────────────┐
│   NestJS API Server    │◄────►│   Socket.io Gateway             │
│   REST + Auth Guards   │      │   Chat, Reactions, Raise Hand   │
│   RBAC Middleware      │      │   Waiting Room, Participant Sync│
└────────────┬───────────┘      └─────────────────────────────────┘
             │
             ▼
┌────────────────────────┐      ┌─────────────────────────────────┐
│   PostgreSQL (Prisma)  │      │   Jitsi Meet (Self-hosted/VPS)  │
│   Users, Meetings,     │      │   WebRTC media, screen share    │
│   Settings, YouTube    │      │   (External service)            │
└────────────────────────┘      └─────────────────────────────────┘
             │
             ▼
┌────────────────────────┐
│   YouTube Data API v3  │
│   Live Streaming API   │
│   (User-owned OAuth)   │
└────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ App Router | SSR, routing, API routes for auth |
| Styling | Tailwind CSS | Utility-first responsive UI |
| State | Zustand | Meeting UI state, toggles, panels |
| Auth | NextAuth.js v5 | Email + Google OAuth, sessions |
| Backend | NestJS | Modular REST API, guards, services |
| Database | PostgreSQL | Persistent storage |
| ORM | Prisma | Type-safe DB access |
| Realtime | Socket.io | Chat, reactions, raise hand, waiting room |
| Media | Jitsi Meet | Browser WebRTC (video/audio/screenshare) |
| Streaming | YouTube Live API | User-owned live stream & recording |

## Module Breakdown

### Frontend Modules (`apps/web`)

- **auth/** — Login, signup, session provider
- **dashboard/** — Meeting list, analytics, quick actions
- **meeting/** — Lobby, waiting room, active meeting room
- **settings/** — Profile, YouTube connection
- **components/** — Reusable UI (controls bar, panels, modals)
- **stores/** — Zustand stores (meeting, ui, auth)
- **lib/** — API client, socket client, Jitsi wrapper

### Backend Modules (`apps/api`)

- **auth/** — JWT validation, NextAuth token verification
- **users/** — Profile CRUD
- **meetings/** — CRUD, scheduling, join logic
- **participants/** — Roles, permissions, moderation
- **youtube/** — OAuth token management, live stream creation
- **gateway/** — Socket.io events (chat, reactions, raise hand)
- **settings/** — Meeting feature toggles

## RBAC Permission Model

```
Role Hierarchy: Host > Co-host > Participant

Permissions Matrix:
┌──────────────────────┬──────┬─────────┬─────────────┐
│ Action               │ Host │ Co-host │ Participant │
├──────────────────────┼──────┼─────────┼─────────────┤
│ End meeting          │  ✓   │    ✗    │      ✗      │
│ Mute participant     │  ✓   │    ✓    │      ✗      │
│ Remove participant   │  ✓   │    ✓    │      ✗      │
│ Make co-host         │  ✓   │    ✗    │      ✗      │
│ Transfer host        │  ✓   │    ✗    │      ✗      │
│ Admit waiting room   │  ✓   │    ✓    │      ✗      │
│ Toggle features      │  ✓   │    ✓*   │      ✗      │
│ Screen share         │  ✓   │    ✓    │    ✓*       │
│ Raise hand           │  ✓   │    ✓    │      ✓      │
│ Chat                 │  ✓   │    ✓    │      ✓      │
└──────────────────────┴──────┴─────────┴─────────────┘
* = when enabled via meetingSettings
```

## Meeting Settings Configuration

```typescript
interface MeetingSettings {
  chatEnabled: boolean;
  chatMode: 'everyone' | 'host_only' | 'disabled';
  reactionsEnabled: boolean;
  raiseHandEnabled: boolean;
  screenShareEnabled: boolean;
  screenShareHostOnly: boolean;
  waitingRoomEnabled: boolean;
  participantRenameEnabled: boolean;
  participantMicAccess: boolean;
  coHostPermissionsEnabled: boolean;
  autoMuteParticipants: boolean;
}
```

## Real-time Event Flow

### Socket.io Namespaces

- `/meeting/:meetingId` — Per-meeting room

### Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `participant:join` | Client → Server | Register in meeting |
| `participant:update` | Server → All | Mic/video/role changes |
| `chat:message` | Bidirectional | Chat messages |
| `reaction:send` | Client → All | Emoji reactions |
| `hand:raise` | Client → Host | Raise hand |
| `hand:acknowledge` | Host → Client | Acknowledge raised hand |
| `waiting:admit` | Host → Server | Admit from waiting room |
| `settings:update` | Host → All | Feature toggle changes |

## Jitsi Integration Strategy

- Embed Jitsi via `@jitsi/react-sdk` or External API (`JitsiMeetExternalAPI`)
- Backend generates JWT tokens for Jitsi auth (optional, for self-hosted)
- Meeting ID maps to Jitsi room name: `boldmeet-{meetingId}`
- Screen share, grid/speaker view handled by Jitsi
- Custom toolbar overlays our controls bar on top

## YouTube Integration Strategy

1. User connects YouTube via Google OAuth (separate scope: `youtube.force-ssl`)
2. Tokens encrypted at rest (AES-256-GCM)
3. Before streaming: verify live streaming enabled via YouTube API
4. On stream start: create liveBroadcast + liveStream via YouTube API
5. RTMP URL + stream key passed to Jitsi recording/streaming config
6. Recording saved to user's YouTube channel (private by default)
7. No video files stored on our servers

## Security Considerations

- NextAuth session cookies (httpOnly, secure)
- API routes protected with session validation
- NestJS guards for RBAC on every endpoint
- Meeting passwords hashed (bcrypt)
- YouTube OAuth tokens encrypted in DB
- Socket.io auth via session token
- CORS restricted to frontend origin
- Rate limiting on auth endpoints

## Deployment Architecture

```
Vercel (Frontend)  ──►  Railway (API + Socket.io)
                              │
                              ▼
                         Railway PostgreSQL
                              │
                         Jitsi VPS (optional)
```

## Environment Variables

```env
# Frontend (.env.local)
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_JITSI_DOMAIN=

# Backend (.env)
DATABASE_URL=
JWT_SECRET=
ENCRYPTION_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
CORS_ORIGIN=
JITSI_APP_ID=
JITSI_APP_SECRET=
```
