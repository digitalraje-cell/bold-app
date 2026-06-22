-- BoldMeet V1: User management, profiles, subscriptions, activity logs, admin

-- Enums
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'LOGOUT', 'MEETING_CREATED', 'MEETING_JOINED', 'MEETING_ENDED');

ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- Organizations (future team / org accounts)
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- User columns
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
CREATE INDEX "users_subscriptionPlan_idx" ON "users"("subscriptionPlan");

-- User profiles
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mobile" TEXT,
    "country" TEXT,
    "organization" TEXT,
    "designation" TEXT,
    "website" TEXT,
    "linkedin_url" TEXT,
    "organization_id" TEXT,
    "profile_completed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");
CREATE INDEX "user_profiles_country_idx" ON "user_profiles"("country");
CREATE INDEX "user_profiles_organization_id_idx" ON "user_profiles"("organization_id");

ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan_name" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "plan_status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan_start_date" TIMESTAMP(3),
    "plan_expiry_date" TIMESTAMP(3),
    "customer_id" TEXT,
    "subscription_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'none',
    "payment_provider" "PaymentProvider",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_plan_name_plan_status_idx" ON "subscriptions"("plan_name", "plan_status");
CREATE INDEX "subscriptions_payment_provider_idx" ON "subscriptions"("payment_provider");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Activity logs
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_userId_createdAt_idx" ON "activity_logs"("userId", "createdAt");
CREATE INDEX "activity_logs_action_createdAt_idx" ON "activity_logs"("action", "createdAt");
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Meeting host ownership fields
ALTER TABLE "meetings" ADD COLUMN "host_name" TEXT;
ALTER TABLE "meetings" ADD COLUMN "host_email" TEXT;

-- Backfill host fields from users
UPDATE "meetings" m
SET "host_name" = u."name", "host_email" = u."email"
FROM "users" u
WHERE m."hostId" = u."id" AND m."host_name" IS NULL;

-- Backfill subscriptions from users
INSERT INTO "subscriptions" ("id", "userId", "plan_name", "plan_status", "plan_start_date", "plan_expiry_date", "payment_status", "createdAt", "updatedAt")
SELECT
    'sub_' || u."id",
    u."id",
    u."subscriptionPlan",
    CASE WHEN u."isActive" = false THEN 'INACTIVE'::"PlanStatus" ELSE 'ACTIVE'::"PlanStatus" END,
    u."createdAt",
    u."subscriptionExpiresAt",
    'none',
    u."createdAt",
    NOW()
FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "subscriptions" s WHERE s."userId" = u."id");

-- Backfill empty profiles
INSERT INTO "user_profiles" ("id", "userId", "createdAt", "updatedAt")
SELECT 'prof_' || u."id", u."id", u."createdAt", NOW()
FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "user_profiles" p WHERE p."userId" = u."id");

-- Super admin (assigned in app on login as well)
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE LOWER("email") = 'digitalraje@gmail.com';
