import { Category } from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  ST_SC: "ST/SC",
  OBC: "OBC",
  GENERAL: "GENERAL",
};

export function resolveFees(
  settings: { feeStScPaise: number; feeObcPaise: number; feeGeneralPaise: number },
  course?: {
    feeStScPaise?: number | null;
    feeObcPaise?: number | null;
    feeGeneralPaise?: number | null;
  } | null,
) {
  return {
    feeStScPaise: course?.feeStScPaise ?? settings.feeStScPaise,
    feeObcPaise: course?.feeObcPaise ?? settings.feeObcPaise,
    feeGeneralPaise: course?.feeGeneralPaise ?? settings.feeGeneralPaise,
  };
}

export function feePaiseForCategory(
  category: Category,
  fees: { feeStScPaise: number; feeObcPaise: number; feeGeneralPaise: number },
) {
  switch (category) {
    case "ST_SC":
      return fees.feeStScPaise;
    case "OBC":
      return fees.feeObcPaise;
    case "GENERAL":
      return fees.feeGeneralPaise;
    default:
      throw new Error("Invalid category");
  }
}

export const HOSTEL_REGISTRATION_FEE_PAISE = 50000;

export function hostelFeePaiseFor(hostelRequired: boolean) {
  return hostelRequired ? HOSTEL_REGISTRATION_FEE_PAISE : 0;
}

export function registrationFeeBreakdown(courseFeePaise: number, hostelRequired: boolean) {
  const hostelFeePaise = hostelFeePaiseFor(hostelRequired);
  return {
    courseFeePaise,
    hostelFeePaise,
    totalPaise: courseFeePaise + hostelFeePaise,
  };
}

export function formatInrFromPaise(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatInrExact(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function parseCategory(value: string): Category {
  if (value === "ST_SC" || value === "OBC" || value === "GENERAL") return value;
  throw new Error("Please select a valid category");
}
