-- YouTube channel metadata + multi-destination streams per meeting
ALTER TABLE "youtube_accounts"
ADD COLUMN IF NOT EXISTS "channelAvatar" TEXT,
ADD COLUMN IF NOT EXISTS "gmailAccount" TEXT;

DROP INDEX IF EXISTS "youtube_streams_meetingId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "youtube_streams_meetingId_youtubeAccountId_key"
ON "youtube_streams"("meetingId", "youtubeAccountId");

CREATE INDEX IF NOT EXISTS "youtube_streams_meetingId_status_idx"
ON "youtube_streams"("meetingId", "status");
