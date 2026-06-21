CREATE TABLE IF NOT EXISTS "pending_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "razorpay_payment_link_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pending_payments_user_id_created_at_idx"
ON "pending_payments"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "pending_payments_payment_status_idx"
ON "pending_payments"("payment_status");

ALTER TABLE "pending_payments"
ADD CONSTRAINT "pending_payments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "roadmap_votes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roadmap_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "roadmap_votes_user_id_feature_key_key"
ON "roadmap_votes"("user_id", "feature_key");

CREATE INDEX IF NOT EXISTS "roadmap_votes_feature_key_idx"
ON "roadmap_votes"("feature_key");

ALTER TABLE "roadmap_votes"
ADD CONSTRAINT "roadmap_votes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
