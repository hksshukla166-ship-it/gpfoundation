import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { additionalPreparationLabel } from "@/lib/catalog";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.courseRegistration.findMany({
    include: { applicant: true, course: true, payments: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const header = ["Application ID", "Name", "Mobile", "Course", "Additional Classes", "Category", "Fee Paise", "Payment", "Status", "Date"];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.applicationId,
        r.applicant.fullName,
        r.applicant.mobile,
        r.course.name,
        r.additionalPreparations.map((id) => additionalPreparationLabel(id)).join("; "),
        r.category,
        r.feePaise,
        r.payments[0]?.status || "",
        r.status,
        r.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    ),
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=registrations.csv",
    },
  });
}
