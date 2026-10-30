import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInrExact } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";
import { paymentModeLabel } from "@/lib/payment-status";
import { courseTypeLabel, examinationGroupLabel, examinationLabel, FEE_REFUND_NOTICE_HI } from "@/lib/exam-groups";
import { maskAadhaar, maskRationNumber } from "@/lib/pii";

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
  const courseFee = row.courseFeePaise ?? Math.max(0, row.feePaise - (row.hostelFeePaise || 0));
  return (
    <div className="mx-auto max-w-2xl bg-white p-10 print:p-0">
      <h1 className="font-brand text-2xl tracking-widest">GP FOUNDATION, KONDAGAON</h1>
      <p className="mt-4">Enrollment / Student ID: {row.applicationId}</p>
      {row.receiptNumber ? <p>Receipt Number: {row.receiptNumber}</p> : null}
      <p>विद्यार्थी का नाम: {name}</p>
      <p>मोबाइल: {row.studentMobile || row.applicant.mobile}</p>
      <p>पिता का नाम: {row.fatherName || row.applicant.fatherName || row.guardianName}</p>
      <p>माता का नाम: {row.motherName || row.applicant.motherName}</p>
      <p>कोर्स: {row.enrolledCourseName || row.course.name}</p>
      <p>Course Type: {courseTypeLabel(row.courseType)}</p>
      <p>Examination Group: {examinationGroupLabel(row.examinationGroup)}</p>
      <p>Selected Examination: {examinationLabel(row.examinationGroup, row.selectedExamination)}</p>
      <p>Hostel Facility: {row.hostelRequired ? "Yes" : "No"}</p>
      <p>बैच/कक्षा: {row.batchOrClass || "—"}</p>
      <p>परीक्षा केंद्र: {examCenterLabel(row.examCenter)}</p>
      <p>पता: {row.postalAddress || formatPostalAddress(row.applicant)}</p>
      <p>Aadhaar: {maskAadhaar(row.applicant.aadhaarNumber)}</p>
      <p>Ration Card: {maskRationNumber(row.applicant.rationCardNumber)}</p>
      <p>Course Registration Fee: {formatInrExact(courseFee)}</p>
      <p>Hostel Registration Fee: {formatInrExact(row.hostelFeePaise || 0)}</p>
      <p>Total Amount: {formatInrExact(payment?.amountPaise ?? row.feePaise)}</p>
      <p>Payment Status: {paid ? "PAID / SUCCESS" : "Pending"}</p>
      <p>Payment Mode: {paymentModeLabel(payment?.paymentMode)}</p>
      <p>Date & time: {(payment?.paidAt || row.createdAt).toLocaleString("en-IN")}</p>
      <p className="mt-6 border border-gold bg-paper p-3 text-sm">{FEE_REFUND_NOTICE_HI}</p>
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </div>
  );
}
