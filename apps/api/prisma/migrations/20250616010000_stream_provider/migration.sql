-- CreateEnum
CREATE TYPE "StreamingProviderType" AS ENUM ('NONE', 'YOUTUBE_RTMP', 'CUSTOM_RTMP');

-- AlterTable
ALTER TABLE "youtube_streams" ADD COLUMN "provider" "StreamingProviderType" NOT NULL DEFAULT 'YOUTUBE_RTMP';
ALTER TABLE "youtube_streams" ADD COLUMN "title" TEXT;
