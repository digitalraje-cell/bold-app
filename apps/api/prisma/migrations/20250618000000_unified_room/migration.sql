-- Unified room architecture: runtime Meeting ↔ Webinar switching

CREATE TYPE "RoomMode" AS ENUM ('MEETING', 'WEBINAR');

ALTER TYPE "ParticipantRole" ADD VALUE 'PANELIST';
ALTER TYPE "ChatMode" ADD VALUE 'HOST_PANELISTS';

ALTER TYPE "SubscriptionPlan" ADD VALUE 'STARTER';
ALTER TYPE "SubscriptionPlan" ADD VALUE 'BUSINESS';

ALTER TABLE "meetings" ADD COLUMN "roomMode" "RoomMode" NOT NULL DEFAULT 'MEETING';

ALTER TABLE "participants" ADD COLUMN "isOnStage" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "participants" ADD COLUMN "micAllowed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "participants" ADD COLUMN "cameraAllowed" BOOLEAN NOT NULL DEFAULT true;
