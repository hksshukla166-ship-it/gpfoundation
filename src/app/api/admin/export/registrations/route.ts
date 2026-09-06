import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.courseRegistration.findMany({
    include: { course: true, applicant: { select: { fullName: true, address: true, district: true, state: true } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const header = [
    "Registration Number",
    "Name",
    "Address",
    "Enrolled Course",
    "Examination Centre",
    "Caste",
    "Amount Paid (INR)",
    "Date",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) => {
      const name =
        (r.studentName && r.studentName !== "[REDACTED]" && r.studentName) ||
        (r.applicant.fullName !== "[REDACTED]" ? r.applicant.fullName : "");
      return [
        r.applicationId,
        name,
        r.postalAddress || formatPostalAddress(r.applicant),
        r.enrolledCourseName || r.course.name,
        examCenterLabel(r.examCenter),
        CATEGORY_LABELS[r.category],
        (r.feePaise / 100).toFixed(0),
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
