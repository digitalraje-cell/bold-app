-- Optional host-uploaded poster shown on meeting invitation / join pages
ALTER TABLE "meeting_settings" ADD COLUMN "posterUrl" TEXT;
