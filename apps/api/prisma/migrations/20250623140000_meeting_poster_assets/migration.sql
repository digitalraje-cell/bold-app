-- Store meeting poster images separately from meeting settings (URL-only reference)
CREATE TABLE "meeting_poster_assets" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_poster_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meeting_poster_assets_hostId_idx" ON "meeting_poster_assets"("hostId");

ALTER TABLE "meeting_poster_assets" ADD CONSTRAINT "meeting_poster_assets_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
