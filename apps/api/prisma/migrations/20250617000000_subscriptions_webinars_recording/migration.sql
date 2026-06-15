-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "WebinarType" AS ENUM ('LIVE', 'EVERGREEN');
CREATE TYPE "WebinarStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'ARCHIVED');
CREATE TYPE "VideoSourceProvider" AS ENUM ('YOUTUBE', 'BOLD_VIDEO');
CREATE TYPE "WebinarModeratorRole" AS ENUM ('MODERATOR', 'CO_MODERATOR');
CREATE TYPE "RecordingProviderType" AS ENUM ('YOUTUBE', 'BOLD_VIDEO', 'STORAGE');

-- AlterEnum
ALTER TYPE "ParticipantRole" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3);
ALTER TABLE "meetings" ADD COLUMN "durationLimitReachedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "webinars" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "WebinarType" NOT NULL DEFAULT 'LIVE',
    "status" "WebinarStatus" NOT NULL DEFAULT 'DRAFT',
    "videoSourceProvider" "VideoSourceProvider" NOT NULL DEFAULT 'YOUTUBE',
    "videoSourceUrl" TEXT,
    "videoSourceId" TEXT,
    "attendeeLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webinar_schedules" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webinar_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webinar_moderators" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "role" "WebinarModeratorRole" NOT NULL DEFAULT 'MODERATOR',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webinar_moderators_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recording_sessions" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT,
    "userId" TEXT NOT NULL,
    "provider" "RecordingProviderType" NOT NULL,
    "externalId" TEXT,
    "status" "StreamStatus" NOT NULL DEFAULT 'IDLE',
    "watchUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recording_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webinars_hostId_idx" ON "webinars"("hostId");
CREATE INDEX "webinars_status_idx" ON "webinars"("status");
CREATE INDEX "webinar_schedules_webinarId_startsAt_idx" ON "webinar_schedules"("webinarId", "startsAt");
CREATE UNIQUE INDEX "webinar_moderators_webinarId_email_key" ON "webinar_moderators"("webinarId", "email");
CREATE INDEX "webinar_moderators_webinarId_idx" ON "webinar_moderators"("webinarId");
CREATE INDEX "recording_sessions_meetingId_idx" ON "recording_sessions"("meetingId");
CREATE INDEX "recording_sessions_userId_idx" ON "recording_sessions"("userId");

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "webinar_schedules" ADD CONSTRAINT "webinar_schedules_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webinar_moderators" ADD CONSTRAINT "webinar_moderators_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
