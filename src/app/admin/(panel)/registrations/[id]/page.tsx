import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";
import { paymentModeLabel, paymentStatusLabel, registrationPaymentLabel } from "@/lib/payment-status";
import { updateRegistrationStatus } from "../../actions";

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.courseRegistration.findUnique({
    where: { id },
    include: {
      course: true,
      applicant: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!row) notFound();

  const name = row.studentName || row.applicant.fullName;
  const payment = row.payments[0];
  const paid = row.status === "PAYMENT_SUCCESSFUL" || payment?.status === "SUCCESS";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">{row.applicationId}</h1>
      <div className="grid gap-2 bg-white p-5 text-sm">
        {row.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.photoUrl} alt={name} className="h-36 w-28 object-cover border" />
        ) : null}
        <p>
          Enrollment / Student ID: <strong>{row.applicationId}</strong>
        </p>
        {row.receiptNumber ? (
          <p>
            Receipt Number: <strong>{row.receiptNumber}</strong>
          </p>
        ) : null}
        <p>विद्यार्थी का नाम: {name}</p>
        <p>मोबाइल: {row.studentMobile || row.applicant.mobile}</p>
        <p>अभिभावक: {row.guardianName || row.applicant.guardianName || row.applicant.fatherName}</p>
        <p>कोर्स: {row.enrolledCourseName || row.course.name}</p>
        <p>बैच/कक्षा: {row.batchOrClass || "—"}</p>
        <p>परीक्षा केंद्र: {examCenterLabel(row.examCenter)}</p>
        <p>पता: {row.postalAddress || formatPostalAddress(row.applicant)}</p>
        <p>Amount: {formatInrFromPaise(row.feePaise)}</p>
        <p>Payment Status: {paid ? "Successful" : registrationPaymentLabel(row.status)}</p>
        {payment ? (
          <>
            <p>Payment record: {paymentStatusLabel(payment.status)}</p>
            <p>Payment Mode: {paymentModeLabel(payment.paymentMode)}</p>
            <p>Date & time: {(payment.paidAt || payment.createdAt).toLocaleString("en-IN")}</p>
          </>
        ) : null}
        {row.receiptToken ? (
          <a className="underline" href={`/api/registration/receipt/${row.receiptToken}`}>
            Download receipt
          </a>
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
