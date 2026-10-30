import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";
import { courseTypeLabel, educationMediumLabel, examinationGroupLabel, examinationLabel } from "@/lib/exam-groups";
import { maskAadhaar, maskRationNumber } from "@/lib/pii";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.courseRegistration.findMany({
    include: { course: true, applicant: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const header = [
    "Registration Number",
    "Name",
    "Father Name",
    "Mother Name",
    "Mobile",
    "Email",
    "Date of Birth",
    "Education Medium",
    "Class 10 Percentage",
    "Ration Card Holder",
    "Ration Card Number",
    "Aadhaar Number",
    "Village",
    "Post Office",
    "Tehsil",
    "District",
    "State",
    "Address",
    "Enrolled Course",
    "Course Type",
    "Examination Group",
    "Selected Examination",
    "Hostel Required",
    "Course Fee (INR)",
    "Hostel Fee (INR)",
    "Total (INR)",
    "Examination Centre",
    "Caste",
    "Payment Status",
    "Receipt Number",
    "Date",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) => {
      const name =
        (r.studentName && r.studentName !== "[REDACTED]" && r.studentName) ||
        (r.applicant.fullName !== "[REDACTED]" ? r.applicant.fullName : "");
      const courseFee = r.courseFeePaise ?? Math.max(0, r.feePaise - (r.hostelFeePaise || 0));
      return [
        r.applicationId,
        name,
        r.fatherName || r.applicant.fatherName || "",
        r.motherName || r.applicant.motherName || "",
        r.studentMobile || r.applicant.mobile || "",
        r.applicant.email || "",
        r.applicant.dateOfBirth.toISOString().slice(0, 10),
        educationMediumLabel(r.applicant.educationMedium),
        r.applicant.class10Percentage ?? "",
        r.applicant.rationCardHolder == null ? "" : r.applicant.rationCardHolder ? "Yes" : "No",
        maskRationNumber(r.applicant.rationCardNumber),
        maskAadhaar(r.applicant.aadhaarNumber),
        r.applicant.village || "",
        r.applicant.postOffice || "",
        r.applicant.tehsil || "",
        r.applicant.district || "",
        r.applicant.state || "",
        r.postalAddress || formatPostalAddress(r.applicant),
        r.enrolledCourseName || r.course.name,
        courseTypeLabel(r.courseType),
        examinationGroupLabel(r.examinationGroup),
        examinationLabel(r.examinationGroup, r.selectedExamination),
        r.hostelRequired ? "Yes" : "No",
        (courseFee / 100).toFixed(2),
        ((r.hostelFeePaise || 0) / 100).toFixed(2),
        (r.feePaise / 100).toFixed(2),
        examCenterLabel(r.examCenter),
        CATEGORY_LABELS[r.category],
        r.status,
        r.receiptNumber || "",
        r.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",");
    }),
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=registrations.csv",
    },
  });
}
