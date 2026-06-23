-- Link poster assets to meetings so binary rows cascade on meeting deletion
ALTER TABLE "meeting_poster_assets" ADD COLUMN "meetingId" TEXT;

CREATE UNIQUE INDEX "meeting_poster_assets_meetingId_key" ON "meeting_poster_assets"("meetingId");

ALTER TABLE "meeting_poster_assets" ADD CONSTRAINT "meeting_poster_assets_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
