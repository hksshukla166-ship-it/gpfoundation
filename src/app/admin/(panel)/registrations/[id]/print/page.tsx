import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";
import { paymentModeLabel } from "@/lib/payment-status";

export default async function PrintRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.courseRegistration.findUnique({
    where: { id },
    include: { course: true, applicant: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!row) notFound();
  const name = row.studentName || row.applicant.fullName;
  const payment = row.payments[0];
  const paid = row.status === "PAYMENT_SUCCESSFUL" || payment?.status === "SUCCESS";
  return (
    <div className="mx-auto max-w-2xl bg-white p-10 print:p-0">
      <h1 className="font-brand text-2xl tracking-widest">GP FOUNDATION, KONDAGAON</h1>
      <p className="mt-4">Enrollment / Student ID: {row.applicationId}</p>
      {row.receiptNumber ? <p>Receipt Number: {row.receiptNumber}</p> : null}
      <p>विद्यार्थी का नाम: {name}</p>
      <p>मोबाइल: {row.studentMobile || row.applicant.mobile}</p>
      <p>अभिभावक: {row.guardianName || row.applicant.guardianName || row.applicant.fatherName}</p>
      <p>कोर्स: {row.enrolledCourseName || row.course.name}</p>
      <p>बैच/कक्षा: {row.batchOrClass || "—"}</p>
      <p>परीक्षा केंद्र: {examCenterLabel(row.examCenter)}</p>
      <p>पता: {row.postalAddress || formatPostalAddress(row.applicant)}</p>
      <p>Amount: {formatInrFromPaise(row.feePaise)}</p>
      <p>Payment Status: {paid ? "PAID / SUCCESS" : "Pending"}</p>
      <p>Payment Mode: {paymentModeLabel(payment?.paymentMode)}</p>
      <p>Date & time: {(payment?.paidAt || row.createdAt).toLocaleString("en-IN")}</p>
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </div>
  );
}
