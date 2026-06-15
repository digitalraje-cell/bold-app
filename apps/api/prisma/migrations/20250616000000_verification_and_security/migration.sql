-- AlterTable
ALTER TABLE "users" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL DEFAULT 'EMAIL',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verifications_email_createdAt_idx" ON "otp_verifications"("email", "createdAt");

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN "passcodeEncrypted" TEXT;
ALTER TABLE "meetings" ADD COLUMN "participantLimit" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "meetings" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
