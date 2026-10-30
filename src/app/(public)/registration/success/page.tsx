import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { formatInrExact } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { courseTypeLabel, examinationGroupLabel, examinationLabel } from "@/lib/exam-groups";
import { safeDb } from "@/lib/settings";
import { DownloadReceiptButton, PaymentStatusPoller } from "@/components/public/download-receipt";
import { paymentStatusLabel } from "@/lib/payment-status";
import { ensureReceiptForApplication, reconcileRegistrationByApplicationId } from "@/lib/payments";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registration Status" };

export default async function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string; status?: string; reason?: string; receiptToken?: string }>;
}) {
  const { applicationId, status, reason, receiptToken: tokenFromQuery } = await searchParams;
  if (status === "failed" && !applicationId) {
    return (
      <Section title="Payment failed">
        <p className="text-muted">{reason || "The payment could not be completed. You can try again from the course page."}</p>
        <Link href="/courses" className="mt-6 inline-block bg-navy px-5 py-3 text-xs tracking-widest text-white">
          BACK TO COURSES
        </Link>
      </Section>
    );
  }

  if (!applicationId) {
    return (
      <Section title="Registration">
        <p>No application was found for this page.</p>
      </Section>
    );
  }

  await reconcileRegistrationByApplicationId(applicationId).catch(() => null);
  await ensureReceiptForApplication(applicationId).catch(() => null);

  const registration = await safeDb(
    () =>
      prisma.courseRegistration.findUnique({
        where: { applicationId },
        include: { course: true, payments: { orderBy: { createdAt: "desc" }, take: 1 }, applicant: true },
      }),
    null,
  );

  if (!registration) {
    return (
      <Section title="Application not found">
        <p>We could not find that application ID.</p>
      </Section>
    );
  }

  const payment = registration.payments[0];
  const paid = registration.status === "PAYMENT_SUCCESSFUL" || payment?.status === "SUCCESS";
  const accessOk = Boolean(tokenFromQuery && registration.receiptToken && tokenFromQuery === registration.receiptToken);
  const receiptToken = accessOk
    ? registration.receiptToken || (await ensureReceiptForApplication(applicationId).catch(() => null))
    : null;
  const courseName = registration.enrolledCourseName || registration.course.name;
  const statusLabel = paid ? "Successful" : paymentStatusLabel(payment?.status);

  return (
    <Section eyebrow="CONFIRMATION" title={paid ? "Registration successful" : "Payment pending"}>
      <div className="max-w-xl space-y-3 border border-line bg-white p-6">
        <p>
          Enrollment / Student ID: <strong className="tracking-wide">{registration.applicationId}</strong>
        </p>
        <p>
          Payment Status: <strong>{paid ? "PAID / SUCCESS" : statusLabel}</strong>
        </p>
        {accessOk ? (
          <>
            {registration.receiptNumber ? (
              <p>
                Receipt Number: <strong>{registration.receiptNumber}</strong>
              </p>
            ) : null}
            {registration.studentName ? <p>विद्यार्थी का नाम: {registration.studentName}</p> : null}
            {registration.studentMobile ? <p>मोबाइल: {registration.studentMobile}</p> : null}
            {registration.fatherName || registration.guardianName ? (
              <p>पिता का नाम: {registration.fatherName || registration.guardianName}</p>
            ) : null}
            <p>कोर्स: {courseName}</p>
            <p>Course Type: {courseTypeLabel(registration.courseType)}</p>
            <p>Examination Group: {examinationGroupLabel(registration.examinationGroup)}</p>
            <p>Selected Examination: {examinationLabel(registration.examinationGroup, registration.selectedExamination)}</p>
            <p>Hostel Facility: {registration.hostelRequired ? "Yes" : "No"}</p>
            {registration.batchOrClass ? <p>बैच/कक्षा: {registration.batchOrClass}</p> : null}
            <p>परीक्षा केंद्र: {examCenterLabel(registration.examCenter)}</p>
            <p>Course Registration Fee: {formatInrExact(registration.courseFeePaise ?? Math.max(0, registration.feePaise - (registration.hostelFeePaise || 0)))}</p>
            <p>Hostel Registration Fee: {formatInrExact(registration.hostelFeePaise || 0)}</p>
            <p>Total Amount: {formatInrExact(payment?.amountPaise ?? registration.feePaise)}</p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Open this page from your payment confirmation link to view full registration details and download the
            receipt.
          </p>
        )}
      </div>
      {paid && receiptToken ? <DownloadReceiptButton token={receiptToken} autoStart /> : null}
      {!paid && accessOk ? (
        <PaymentStatusPoller applicationId={registration.applicationId} token={tokenFromQuery || ""} />
      ) : null}
      <p className="mt-6 text-sm text-muted">Please save your enrollment number for all future correspondence with GP Foundation.</p>
    </Section>
  );
}
