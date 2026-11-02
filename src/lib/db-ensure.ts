import { prisma } from "@/lib/prisma";

const STATEMENTS = [
  `DO $$ BEGIN CREATE TYPE "EducationMedium" AS ENUM ('HINDI', 'ENGLISH'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "CourseType" AS ENUM ('CRASH_COURSE', 'REGULAR_COURSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "ExaminationGroup" AS ENUM ('BIOLOGY', 'MATHEMATICS', 'AGRICULTURE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "motherName" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "educationMedium" "EducationMedium"`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "class10Percentage" DOUBLE PRECISION`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "rationCardHolder" BOOLEAN`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "rationCardNumber" TEXT`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "village" TEXT`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "postOffice" TEXT`,
  `ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "tehsil" TEXT`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "fatherName" TEXT`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "motherName" TEXT`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "courseType" "CourseType"`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "examinationGroup" "ExaminationGroup"`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "selectedExamination" TEXT`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "hostelRequired" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "courseFeePaise" INTEGER`,
  `ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "hostelFeePaise" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "courseFeePaise" INTEGER`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "hostelFeePaise" INTEGER`,
];

const globalForEnsure = globalThis as unknown as { gpSchemaEnsure?: Promise<void> };

export function ensureRegistrationSchema() {
  if (!globalForEnsure.gpSchemaEnsure) {
    globalForEnsure.gpSchemaEnsure = (async () => {
      for (const sql of STATEMENTS) {
        await prisma.$executeRawUnsafe(sql);
      }
    })().catch((error) => {
      globalForEnsure.gpSchemaEnsure = undefined;
      throw error;
    });
  }
  return globalForEnsure.gpSchemaEnsure;
}

export function prismaErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const compact = message.replace(/\s+/g, " ").trim();
  if (/Can't reach database server/i.test(compact)) {
    return "The database server could not be reached. Check DATABASE_URL and that the Neon project is running.";
  }
  if (/does not exist/i.test(compact) || /P2022|P2010|P2021/.test(compact)) {
    return "The registration tables are missing new columns. Refresh once after the schema update, or run the latest Prisma migration.";
  }
  return "Course registrations could not be loaded.";
}
