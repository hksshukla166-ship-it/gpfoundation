-- Safe additive migration. Does not drop tables or existing rows.

DO $$ BEGIN
  CREATE TYPE "EducationMedium" AS ENUM ('HINDI', 'ENGLISH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CourseType" AS ENUM ('CRASH_COURSE', 'REGULAR_COURSE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExaminationGroup" AS ENUM ('BIOLOGY', 'MATHEMATICS', 'AGRICULTURE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Applicant"
  ADD COLUMN IF NOT EXISTS "motherName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "educationMedium" "EducationMedium",
  ADD COLUMN IF NOT EXISTS "class10Percentage" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "rationCardHolder" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "rationCardNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "village" TEXT,
  ADD COLUMN IF NOT EXISTS "postOffice" TEXT,
  ADD COLUMN IF NOT EXISTS "tehsil" TEXT;

ALTER TABLE "CourseRegistration"
  ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "fatherName" TEXT,
  ADD COLUMN IF NOT EXISTS "motherName" TEXT,
  ADD COLUMN IF NOT EXISTS "courseType" "CourseType",
  ADD COLUMN IF NOT EXISTS "examinationGroup" "ExaminationGroup",
  ADD COLUMN IF NOT EXISTS "selectedExamination" TEXT,
  ADD COLUMN IF NOT EXISTS "hostelRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "courseFeePaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "hostelFeePaise" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "courseFeePaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "hostelFeePaise" INTEGER;

CREATE TABLE IF NOT EXISTS "ReceiptSequence" (
  "year" INTEGER NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ReceiptSequence_pkey" PRIMARY KEY ("year")
);

CREATE INDEX IF NOT EXISTS "CourseRegistration_courseType_idx" ON "CourseRegistration"("courseType");
CREATE INDEX IF NOT EXISTS "CourseRegistration_examinationGroup_idx" ON "CourseRegistration"("examinationGroup");
CREATE INDEX IF NOT EXISTS "CourseRegistration_selectedExamination_idx" ON "CourseRegistration"("selectedExamination");
CREATE INDEX IF NOT EXISTS "CourseRegistration_hostelRequired_idx" ON "CourseRegistration"("hostelRequired");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseRegistration_receiptNumber_key" ON "CourseRegistration"("receiptNumber");
