CREATE TABLE IF NOT EXISTS "app_releases" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "releaseNotes" JSONB NOT NULL,
    "forceUpdate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_releases_version_key" ON "app_releases"("version");

INSERT INTO "app_releases" ("id", "version", "releaseDate", "releaseNotes", "forceUpdate", "createdAt", "updatedAt")
VALUES (
  'seed_release_1_0_0',
  '1.0.0',
  '2026-06-22'::timestamp,
  '["PWA support", "Mobile improvements", "Faster meeting join"]'::jsonb,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("version") DO NOTHING;
