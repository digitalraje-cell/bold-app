-- Super admin role + default super admin account (safe, non-destructive)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

UPDATE "users"
SET "role" = 'SUPER_ADMIN'
WHERE LOWER("email") = 'digitalraje@gmail.com';
