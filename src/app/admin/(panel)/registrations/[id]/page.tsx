import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";
import { updateRegistrationStatus } from "../../actions";

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">{row.applicationId}</h1>
      <div className="grid gap-2 bg-white p-5 text-sm">
        <p>
          Registration number: <strong>{row.applicationId}</strong>
        </p>
        <p>Name: {name}</p>
        <p>Address: {row.postalAddress || formatPostalAddress(row.applicant)}</p>
        <p>Enrolled course: {row.enrolledCourseName || row.course.name}</p>
        <p>Examination centre: {examCenterLabel(row.examCenter)}</p>
        <p>Caste: {CATEGORY_LABELS[row.category]}</p>
        <p>Amount paid: {formatInrFromPaise(row.feePaise)}</p>
        {row.receiptDownloadedAt ? (
          <p className="text-muted">Student receipt downloaded and deleted from the server on {row.receiptDownloadedAt.toLocaleString("en-IN")}.</p>
        ) : row.receiptToken ? (
          <p className="text-muted">Student receipt is waiting to be downloaded; it will be deleted from the server after download.</p>
        ) : null}
      </div>
      <form action={updateRegistrationStatus} className="space-y-3 bg-white p-5">
        <input type="hidden" name="id" value={row.id} />
        <label className="block text-sm">
          Application status
          <select name="status" defaultValue={row.status} className="mt-1 w-full border px-3 py-2">
            {["PENDING", "PAYMENT_INITIATED", "PAYMENT_SUCCESSFUL", "PAYMENT_FAILED", "UNDER_REVIEW", "VERIFIED", "CONFIRMED", "REJECTED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Admin notes
          <textarea name="adminNotes" defaultValue={row.adminNotes ?? ""} className="mt-1 w-full border px-3 py-2" />
        </label>
        <div className="flex gap-3">
          <button className="bg-navy px-4 py-2 text-xs tracking-widest text-white">UPDATE STATUS</button>
          <a href={`/admin/registrations/${row.id}/print`} className="border px-4 py-2 text-xs tracking-widest">
            PRINT
          </a>
        </div>
      </form>
    </div>
  );
}
