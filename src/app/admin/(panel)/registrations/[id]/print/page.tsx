import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";

export default async function PrintRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.courseRegistration.findUnique({
    where: { id },
    include: { course: true, applicant: { select: { fullName: true, address: true, district: true, state: true } } },
  });
  if (!row) notFound();
  const name =
    (row.studentName && row.studentName !== "[REDACTED]" && row.studentName) ||
    (row.applicant.fullName !== "[REDACTED]" ? row.applicant.fullName : "—");
  return (
    <div className="mx-auto max-w-2xl bg-white p-10 print:p-0">
      <h1 className="font-brand text-2xl tracking-widest">GP FOUNDATION, KONDAGAON</h1>
      <p className="mt-4">Registration number: {row.applicationId}</p>
      <p>Name: {name}</p>
      <p>Address: {row.postalAddress || formatPostalAddress(row.applicant)}</p>
      <p>Enrolled course: {row.enrolledCourseName || row.course.name}</p>
      <p>Examination centre: {examCenterLabel(row.examCenter)}</p>
      <p>Caste: {CATEGORY_LABELS[row.category]}</p>
      <p>Amount paid: {formatInrFromPaise(row.feePaise)}</p>
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </div>
  );
}
