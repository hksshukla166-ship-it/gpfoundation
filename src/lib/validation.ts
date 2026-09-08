import { z } from "zod";
import { ADDITIONAL_PREPARATION_IDS, EXAM_CENTER_IDS } from "@/lib/catalog";

export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  interestedProgram: z.string().trim().max(160).optional(),
  message: z.string().trim().min(3).max(4000),
});

export const registrationSchema = z.object({
  courseId: z.string().min(1),
  category: z.enum(["ST_SC", "OBC", "GENERAL"]),
  examCenter: z.enum(EXAM_CENTER_IDS),
  fullName: z.string().trim().min(2).max(120),
  guardianName: z.string().trim().min(2).max(120),
  fatherName: z.string().trim().max(120).optional(),
  motherName: z.string().trim().max(120).optional(),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  dateOfBirth: z.string().min(8).optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().default("OTHER"),
  address: z.string().trim().max(500).optional().default(""),
  district: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().max(80).optional().default(""),
  qualification: z.string().trim().max(160).optional().default(""),
  schoolCollege: z.string().trim().max(160).optional(),
  batchOrClass: z.string().trim().min(1).max(120),
  photoUrl: z.string().min(1),
  documentUrl: z.string().optional(),
  additionalPreparations: z.array(z.enum(ADDITIONAL_PREPARATION_IDS)).optional().default([]),
});
