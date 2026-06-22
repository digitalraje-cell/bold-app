-- Extensible connected accounts + Max plan waitlist
CREATE TYPE "ConnectedAccountProvider" AS ENUM (
  'YOUTUBE',
  'FACEBOOK',
  'INSTAGRAM',
  'LINKEDIN',
  'X',
  'TWITCH',
  'CUSTOM_RTMP'
);

CREATE TYPE "ConnectedAccountStatus" AS ENUM (
  'ACTIVE',
  'PENDING_ACTIVATION',
  'DISABLED',
  'DISCONNECTED'
);

CREATE TYPE "PlanInterestType" AS ENUM ('MAX');

CREATE TABLE "connected_accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" "ConnectedAccountProvider" NOT NULL,
  "account_id" TEXT NOT NULL,
  "account_name" TEXT NOT NULL,
  "account_type" TEXT,
  "account_avatar" TEXT,
  "account_email" TEXT,
  "status" "ConnectedAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "metadata" JSONB,
  "legacy_youtube_account_id" TEXT,
  "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_validated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_interests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "plan_interest" "PlanInterestType" NOT NULL DEFAULT 'MAX',
  "requested_providers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plan_interests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connected_accounts_legacy_youtube_account_id_key"
  ON "connected_accounts"("legacy_youtube_account_id");

CREATE UNIQUE INDEX "connected_accounts_user_id_provider_account_id_key"
  ON "connected_accounts"("user_id", "provider", "account_id");

CREATE INDEX "connected_accounts_user_id_provider_idx"
  ON "connected_accounts"("user_id", "provider");

CREATE UNIQUE INDEX "plan_interests_user_id_plan_interest_key"
  ON "plan_interests"("user_id", "plan_interest");

CREATE INDEX "plan_interests_plan_interest_idx"
  ON "plan_interests"("plan_interest");

ALTER TABLE "connected_accounts"
  ADD CONSTRAINT "connected_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_interests"
  ADD CONSTRAINT "plan_interests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
