-- Multi YouTube channel support per host
DROP INDEX IF EXISTS "youtube_accounts_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "youtube_accounts_userId_channelId_key"
ON "youtube_accounts"("userId", "channelId");

CREATE INDEX IF NOT EXISTS "youtube_accounts_userId_idx"
ON "youtube_accounts"("userId");

ALTER TABLE "youtube_accounts"
ADD COLUMN IF NOT EXISTS "eligibilityCheckedAt" TIMESTAMP(3);

ALTER TABLE "youtube_streams"
ADD COLUMN IF NOT EXISTS "youtubeAccountId" TEXT;

ALTER TABLE "youtube_streams"
ADD CONSTRAINT "youtube_streams_youtubeAccountId_fkey"
FOREIGN KEY ("youtubeAccountId") REFERENCES "youtube_accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
