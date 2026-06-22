-- Meeting registration form builder

CREATE TYPE "RegistrationFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'EMAIL', 'PHONE');
CREATE TYPE "StandardRegistrationField" AS ENUM ('FULL_NAME', 'EMAIL', 'PHONE', 'CITY', 'STATE', 'COUNTRY', 'COMPANY', 'DESIGNATION', 'WEBSITE', 'LINKEDIN');
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'JOINED');

CREATE TABLE "meeting_registration_forms" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "require_approval" BOOLEAN NOT NULL DEFAULT false,
    "auto_approve" BOOLEAN NOT NULL DEFAULT true,
    "send_confirmation_email" BOOLEAN NOT NULL DEFAULT false,
    "limit_registrations" BOOLEAN NOT NULL DEFAULT false,
    "max_registrations" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_registration_forms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_registration_forms_meetingId_key" ON "meeting_registration_forms"("meetingId");

ALTER TABLE "meeting_registration_forms" ADD CONSTRAINT "meeting_registration_forms_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "meeting_registration_fields" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "RegistrationFieldType" NOT NULL,
    "standardField" "StandardRegistrationField",
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "placeholder" TEXT,
    "help_text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_registration_fields_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_registration_fields_formId_fieldKey_key" ON "meeting_registration_fields"("formId", "fieldKey");
CREATE INDEX "meeting_registration_fields_formId_sort_order_idx" ON "meeting_registration_fields"("formId", "sort_order");

ALTER TABLE "meeting_registration_fields" ADD CONSTRAINT "meeting_registration_fields_formId_fkey" FOREIGN KEY ("formId") REFERENCES "meeting_registration_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "meeting_registrations" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "formId" TEXT,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "designation" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "website" TEXT,
    "linkedin_url" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'APPROVED',
    "joined_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_registrations_meetingId_email_key" ON "meeting_registrations"("meetingId", "email");
CREATE INDEX "meeting_registrations_meetingId_status_idx" ON "meeting_registrations"("meetingId", "status");
CREATE INDEX "meeting_registrations_formId_idx" ON "meeting_registrations"("formId");

ALTER TABLE "meeting_registrations" ADD CONSTRAINT "meeting_registrations_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_registrations" ADD CONSTRAINT "meeting_registrations_formId_fkey" FOREIGN KEY ("formId") REFERENCES "meeting_registration_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "meeting_registration_answers" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "meeting_registration_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_registration_answers_registration_id_field_id_key" ON "meeting_registration_answers"("registration_id", "field_id");
CREATE INDEX "meeting_registration_answers_field_id_idx" ON "meeting_registration_answers"("field_id");

ALTER TABLE "meeting_registration_answers" ADD CONSTRAINT "meeting_registration_answers_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "meeting_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_registration_answers" ADD CONSTRAINT "meeting_registration_answers_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "meeting_registration_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy meeting_registrants
INSERT INTO "meeting_registrations" (
    "id", "meetingId", "email", "full_name", "phone", "company", "designation",
    "status", "approved_at", "createdAt", "updatedAt"
)
SELECT
    "id",
    "meetingId",
    "email",
    "fullName",
    "phone",
    "company",
    "designation",
    'APPROVED'::"RegistrationStatus",
    "createdAt",
    "createdAt",
    NOW()
FROM "meeting_registrants";

-- Create default forms for meetings with registration required
INSERT INTO "meeting_registration_forms" ("id", "meetingId", "auto_approve", "createdAt", "updatedAt")
SELECT
    'regform_' || m."id",
    m."id",
    true,
    NOW(),
    NOW()
FROM "meetings" m
JOIN "meeting_settings" s ON s."meetingId" = m."id"
WHERE s."registrationRequired" = true
  AND NOT EXISTS (SELECT 1 FROM "meeting_registration_forms" f WHERE f."meetingId" = m."id");

INSERT INTO "meeting_registration_fields" (
    "id", "formId", "fieldKey", "label", "fieldType", "standardField",
    "is_required", "is_enabled", "is_locked", "sort_order", "createdAt", "updatedAt"
)
SELECT
    'regfld_' || f."id" || '_name',
    f."id",
    'full_name',
    'Full Name',
    'TEXT'::"RegistrationFieldType",
    'FULL_NAME'::"StandardRegistrationField",
    true, true, true, 0, NOW(), NOW()
FROM "meeting_registration_forms" f
WHERE NOT EXISTS (
    SELECT 1 FROM "meeting_registration_fields" fld
    WHERE fld."formId" = f."id" AND fld."fieldKey" = 'full_name'
);

INSERT INTO "meeting_registration_fields" (
    "id", "formId", "fieldKey", "label", "fieldType", "standardField",
    "is_required", "is_enabled", "is_locked", "sort_order", "createdAt", "updatedAt"
)
SELECT
    'regfld_' || f."id" || '_email',
    f."id",
    'email',
    'Email Address',
    'EMAIL'::"RegistrationFieldType",
    'EMAIL'::"StandardRegistrationField",
    true, true, true, 1, NOW(), NOW()
FROM "meeting_registration_forms" f
WHERE NOT EXISTS (
    SELECT 1 FROM "meeting_registration_fields" fld
    WHERE fld."formId" = f."id" AND fld."fieldKey" = 'email'
);

UPDATE "meeting_registrations" r
SET "formId" = f."id"
FROM "meeting_registration_forms" f
WHERE r."meetingId" = f."meetingId" AND r."formId" IS NULL;

DROP TABLE "meeting_registrants";
