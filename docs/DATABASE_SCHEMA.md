# Bold — Database Schema

## Entity Relationship Diagram

```
User ──────────────┬──────────── Meeting (host)
  │                │                │
  │                │                ├── MeetingSettings (1:1)
  │                │                ├── Participant (1:N)
  │                │                ├── ChatMessage (1:N)
  │                │                └── YouTubeStream (0:1)
  │                │
  └── YouTubeAccount (0:1)
  └── Account (NextAuth)
  └── Session (NextAuth)
```

## Prisma Schema

```prisma
// ─── Enums ───────────────────────────────────────────

enum UserRole {
  USER
  ADMIN
}

enum MeetingStatus {
  SCHEDULED
  LIVE
  ENDED
}

enum ParticipantRole {
  HOST
  CO_HOST
  PARTICIPANT
}

enum ParticipantStatus {
  WAITING
  ADMITTED
  REMOVED
  LEFT
}

enum ChatMode {
  EVERYONE
  HOST_ONLY
  DISABLED
}

enum StreamVisibility {
  PRIVATE
  UNLISTED
  PUBLIC
}

enum StreamStatus {
  IDLE
  LIVE
  ENDED
  ERROR
}

// ─── Models ──────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  passwordHash  String?   // null for OAuth-only users
  role          UserRole  @default(USER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  hostedMeetings Meeting[]       @relation("MeetingHost")
  participants   Participant[]
  youtubeAccount YouTubeAccount?
  chatMessages   ChatMessage[]

  @@map("users")
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── Meeting ─────────────────────────────────────────

model Meeting {
  id          String        @id @default(cuid())
  meetingCode String        @unique // Short join code (e.g. "abc-defg-hij")
  title       String
  description String?
  hostId      String
  status      MeetingStatus @default(SCHEDULED)
  password    String?       // bcrypt hashed
  scheduledAt DateTime?
  startedAt   DateTime?
  endedAt     DateTime?
  jitsiRoom   String        @unique
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  host         User             @relation("MeetingHost", fields: [hostId], references: [id])
  settings     MeetingSettings?
  participants Participant[]
  chatMessages ChatMessage[]
  youtubeStream YouTubeStream?

  @@index([hostId])
  @@index([status])
  @@index([scheduledAt])
  @@map("meetings")
}

model MeetingSettings {
  id                       String   @id @default(cuid())
  meetingId                String   @unique
  chatEnabled              Boolean  @default(true)
  chatMode                 ChatMode @default(EVERYONE)
  reactionsEnabled         Boolean  @default(true)
  raiseHandEnabled         Boolean  @default(true)
  screenShareEnabled       Boolean  @default(true)
  screenShareHostOnly      Boolean  @default(false)
  waitingRoomEnabled       Boolean  @default(false)
  participantRenameEnabled Boolean  @default(false)
  participantMicAccess     Boolean  @default(true)
  coHostPermissionsEnabled Boolean  @default(true)
  autoMuteParticipants     Boolean  @default(false)

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@map("meeting_settings")
}

// ─── Participants ────────────────────────────────────

model Participant {
  id          String            @id @default(cuid())
  meetingId   String
  userId      String?           // null for guest participants
  displayName String
  role        ParticipantRole   @default(PARTICIPANT)
  status      ParticipantStatus @default(WAITING)
  isMuted     Boolean           @default(false)
  isVideoOff  Boolean           @default(false)
  handRaised  Boolean           @default(false)
  handRaisedAt DateTime?
  joinedAt    DateTime          @default(now())
  leftAt      DateTime?

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id])

  @@unique([meetingId, userId])
  @@index([meetingId])
  @@map("participants")
}

// ─── Chat ────────────────────────────────────────────

model ChatMessage {
  id          String   @id @default(cuid())
  meetingId   String
  senderId    String
  content     String
  isHostOnly  Boolean  @default(false)
  createdAt   DateTime @default(now())

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  sender  User    @relation(fields: [senderId], references: [id])

  @@index([meetingId, createdAt])
  @@map("chat_messages")
}

// ─── YouTube ─────────────────────────────────────────

model YouTubeAccount {
  id              String   @id @default(cuid())
  userId          String   @unique
  channelId       String
  channelName     String
  channelUrl      String?
  accessToken     String   @db.Text // AES-256-GCM encrypted
  refreshToken    String   @db.Text // AES-256-GCM encrypted
  tokenExpiresAt  DateTime
  liveStreamingEnabled Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("youtube_accounts")
}

model YouTubeStream {
  id              String           @id @default(cuid())
  meetingId       String           @unique
  broadcastId     String?
  streamId        String?
  streamKey       String?          @db.Text // encrypted
  rtmpUrl         String?
  watchUrl        String?
  visibility      StreamVisibility @default(PRIVATE)
  status          StreamStatus     @default(IDLE)
  startedAt       DateTime?
  endedAt         DateTime?
  createdAt       DateTime         @default(now())

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@map("youtube_streams")
}
```

## Indexes & Performance Notes

- `meetings.meetingCode` — fast join-by-code lookups
- `meetings.status + scheduledAt` — dashboard queries
- `participants.meetingId` — attendee list
- `chat_messages.meetingId + createdAt` — paginated chat history
- Sensitive fields (tokens, stream keys) encrypted at application layer

## Migration Strategy

1. Initial migration with all models
2. Seed script for dev user (optional)
3. Prisma migrate in CI/CD pipeline
