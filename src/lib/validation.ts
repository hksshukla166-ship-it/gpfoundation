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
  fatherName: z.string().trim().min(2).max(120),
  motherName: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  dateOfBirth: z.string().min(8),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().trim().min(5).max(500),
  district: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  qualification: z.string().trim().min(2).max(160),
  schoolCollege: z.string().trim().max(160).optional(),
  photoUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  additionalPreparations: z.array(z.enum(ADDITIONAL_PREPARATION_IDS)).optional().default([]),
});
