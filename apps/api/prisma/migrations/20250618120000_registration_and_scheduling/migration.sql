-- Registration required setting, scheduled duration fields, and registrant records

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "scheduledEndAt" TIMESTAMP(3);
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;

ALTER TABLE "meeting_settings" ADD COLUMN IF NOT EXISTS "registrationRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "meeting_registrants" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_registrants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "meeting_registrants_meetingId_email_key" ON "meeting_registrants"("meetingId", "email");
CREATE INDEX IF NOT EXISTS "meeting_registrants_meetingId_idx" ON "meeting_registrants"("meetingId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meeting_registrants_meetingId_fkey'
  ) THEN
    ALTER TABLE "meeting_registrants"
      ADD CONSTRAINT "meeting_registrants_meetingId_fkey"
      FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
