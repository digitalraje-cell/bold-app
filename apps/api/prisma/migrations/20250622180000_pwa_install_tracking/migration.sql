-- PWA install tracking on users (no host_metadata changes)
ALTER TABLE "users" ADD COLUMN "is_pwa_installed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "pwa_installed_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "last_pwa_launch_at" TIMESTAMP(3);
