# Bold — Folder Structure

```
Bold/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── signup/page.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── meetings/
│   │   │   │   │   │   ├── create/page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── profile/page.tsx
│   │   │   │   │       └── youtube/page.tsx
│   │   │   │   ├── meeting/
│   │   │   │   │   └── [meetingId]/
│   │   │   │   │       ├── page.tsx          # Lobby
│   │   │   │   │       ├── waiting/page.tsx  # Waiting room
│   │   │   │   │       └── room/page.tsx     # Active meeting
│   │   │   │   ├── api/
│   │   │   │   │   └── auth/[...nextauth]/route.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                  # Landing
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                       # Base UI (Button, Input, Modal...)
│   │   │   │   ├── layout/                   # Header, Sidebar, Footer
│   │   │   │   ├── meeting/
│   │   │   │   │   ├── ControlsBar.tsx
│   │   │   │   │   ├── ParticipantsPanel.tsx
│   │   │   │   │   ├── ChatPanel.tsx
│   │   │   │   │   ├── ReactionsOverlay.tsx
│   │   │   │   │   ├── RaiseHandQueue.tsx
│   │   │   │   │   ├── WaitingRoomPanel.tsx
│   │   │   │   │   ├── JitsiContainer.tsx
│   │   │   │   │   ├── FullscreenWrapper.tsx
│   │   │   │   │   └── MeetingSettingsPanel.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── MeetingCard.tsx
│   │   │   │   │   ├── MeetingList.tsx
│   │   │   │   │   └── QuickActions.tsx
│   │   │   │   └── auth/
│   │   │   │       ├── LoginForm.tsx
│   │   │   │       └── SignupForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useMeeting.ts
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useJitsi.ts
│   │   │   │   └── useFullscreen.ts
│   │   │   ├── stores/
│   │   │   │   ├── meetingStore.ts
│   │   │   │   ├── uiStore.ts
│   │   │   │   └── authStore.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── socket.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── utils.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.guard.ts
│       │   │   └── auth.service.ts
│       │   ├── users/
│       │   │   ├── users.module.ts
│       │   │   ├── users.controller.ts
│       │   │   └── users.service.ts
│       │   ├── meetings/
│       │   │   ├── meetings.module.ts
│       │   │   ├── meetings.controller.ts
│       │   │   ├── meetings.service.ts
│       │   │   └── dto/
│       │   ├── participants/
│       │   │   ├── participants.module.ts
│       │   │   ├── participants.controller.ts
│       │   │   └── participants.service.ts
│       │   ├── youtube/
│       │   │   ├── youtube.module.ts
│       │   │   ├── youtube.controller.ts
│       │   │   └── youtube.service.ts
│       │   ├── gateway/
│       │   │   ├── gateway.module.ts
│       │   │   └── meeting.gateway.ts
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts
│       │   │   └── prisma.service.ts
│       │   └── common/
│       │       ├── decorators/
│       │       ├── guards/
│       │       ├── filters/
│       │       └── interceptors/
│       ├── prisma/
│       │   └── schema.prisma
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared types & constants
│       ├── src/
│       │   ├── types/
│       │   │   ├── meeting.ts
│       │   │   ├── user.ts
│       │   │   ├── participant.ts
│       │   │   └── socket-events.ts
│       │   ├── constants/
│       │   │   ├── roles.ts
│       │   │   └── meeting-settings.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── COMPONENT_PLAN.md
│   └── ROADMAP.md
│
├── docker-compose.yml                # PostgreSQL local dev
├── package.json                      # Monorepo root
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
└── README.md
```
