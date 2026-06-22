-- Ensure super admin account (idempotent)
UPDATE "users"
SET "role" = 'SUPER_ADMIN'
WHERE LOWER("email") = 'digitalraje@gmail.com';
