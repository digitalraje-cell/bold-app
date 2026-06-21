# Bold

A production-ready browser-based meeting platform built with Next.js, NestJS, PostgreSQL, Socket.io, and Jitsi Meet.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend:** NestJS, Prisma, PostgreSQL
- **Realtime:** Socket.io
- **Meetings:** Jitsi Meet Open Source
- **Auth:** NextAuth.js (Email OTP)
- **Streaming:** YouTube Live API

## Project Structure

```
Bold/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types & constants
├── docs/             # Architecture & planning docs
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Copy environment files
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Generate Prisma client & run migrations
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000/api/health

## Documentation

- **[Final Launch Checklist](./docs/FINAL_LAUNCH_CHECKLIST.md)** — credentials, auth flow, deploy steps
- [Launch Deployment Guide](./docs/LAUNCH_DEPLOYMENT.md)
- [V1 Launch Report](./docs/V1_LAUNCH_REPORT.md)
- [Architecture Plan](./docs/ARCHITECTURE.md)
- [Subscriptions & Permissions](./docs/SUBSCRIPTIONS.md)
- [Deployment Plan](./docs/DEPLOYMENT.md)

## License

Private — All rights reserved.
