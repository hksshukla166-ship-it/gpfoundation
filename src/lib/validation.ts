import { z } from "zod";
import { ADDITIONAL_PREPARATION_IDS, EXAM_CENTER_IDS } from "@/lib/catalog";
import { COURSE_TYPE_IDS, EDUCATION_MEDIUM_IDS, EXAMINATION_GROUP_IDS, isExamInGroup } from "@/lib/exam-groups";
import { digitsOnly } from "@/lib/pii";

const indianMobile = z
  .string()
  .trim()
  .transform((value) => digitsOnly(value).replace(/^91/, "").slice(-10))
  .refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: "Please enter a valid 10-digit mobile number.",
  });

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || "")
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Please enter a valid email address, or leave it blank.",
  });

const uploadPath = (folder: string, label: string) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .refine((value) => new RegExp(`^/uploads/${folder}/[\\w.-]+$`).test(value), {
      message: `${label} could not be saved. Please upload a JPG, PNG, or WebP image under 4 MB.`,
    });

export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  interestedProgram: z.string().trim().max(160).optional(),
  message: z.string().trim().min(3).max(4000),
});

export const registrationSchema = z
  .object({
    courseId: z.string().min(1, "Please select your main program."),
    category: z.enum(["ST_SC", "OBC", "GENERAL"], { message: "Please select your category." }),
    examCenter: z.enum(EXAM_CENTER_IDS, { message: "Please select an exam centre." }),
    fullName: z.string().trim().min(2, "Please enter the student's full name.").max(120),
    fatherName: z.string().trim().min(2, "Please enter father's name.").max(120),
    motherName: z.string().trim().min(2, "Please enter mother's name.").max(120),
    guardianName: z.string().trim().max(120).optional(),
    mobile: indianMobile,
    email: optionalEmail,
    dateOfBirth: z
      .string()
      .min(8, "Please enter a valid date of birth.")
      .refine((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return false;
        const now = new Date();
        const min = new Date(now.getFullYear() - 80, 0, 1);
        const max = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
        return date >= min && date <= max;
      }, "Please enter a valid date of birth."),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().default("OTHER"),
    educationMedium: z.enum(EDUCATION_MEDIUM_IDS, { message: "Please select Hindi or English medium." }),
    class10Percentage: z.coerce
      .number({ message: "Please enter Class 10th percentage." })
      .min(0, "Class 10th percentage must be between 0 and 100.")
      .max(100, "Class 10th percentage must be between 0 and 100."),
    rationCardHolder: z.boolean({ message: "Please say whether the student has a ration card." }),
    rationCardNumber: z.string().trim().max(40).optional().or(z.literal("")),
    aadhaarNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => digitsOnly(value || ""))
      .refine((value) => !value || /^\d{12}$/.test(value), {
        message: "Aadhaar number must be 12 digits, or leave it blank.",
      }),
    village: z.string().trim().min(2, "Please enter village.").max(120),
    postOffice: z.string().trim().min(2, "Please enter post office.").max(120),
    tehsil: z.string().trim().min(2, "Please enter tehsil.").max(120),
    address: z.string().trim().max(500).optional().default(""),
    district: z.string().trim().min(2, "Please enter district.").max(80),
    state: z.string().trim().min(2, "Please enter state.").max(80),
    qualification: z.string().trim().max(160).optional().default(""),
    schoolCollege: z.string().trim().max(160).optional(),
    batchOrClass: z.string().trim().min(1, "Please enter batch or class.").max(120),
    courseType: z.enum(COURSE_TYPE_IDS, { message: "Please select Crash Course or Regular Course." }),
    examinationGroup: z.enum(EXAMINATION_GROUP_IDS, { message: "Please select an examination group." }),
    selectedExamination: z.string().min(1, "Please select an examination."),
    hostelRequired: z.boolean({ message: "Please say whether hostel accommodation is required." }),
    photoUrl: uploadPath("applicants", "Student photograph"),
    signatureUrl: uploadPath("signatures", "Student signature"),
    documentUrl: z.string().optional(),
    additionalPreparations: z.array(z.enum(ADDITIONAL_PREPARATION_IDS)).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.rationCardHolder) {
      if (!data.rationCardNumber || data.rationCardNumber.trim().length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["rationCardNumber"],
          message: "Please enter the ration card number.",
        });
      }
    }
    if (!isExamInGroup(data.examinationGroup, data.selectedExamination)) {
      ctx.addIssue({
        code: "custom",
        path: ["selectedExamination"],
        message: "Please select an examination that belongs to the chosen group.",
      });
    }
  });
