-- Subscription payments for Razorpay Pro billing
CREATE TABLE IF NOT EXISTS "subscription_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "amountInr" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "subscription_payments_userId_createdAt_idx"
ON "subscription_payments"("userId", "createdAt");

ALTER TABLE "subscription_payments"
ADD CONSTRAINT "subscription_payments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
