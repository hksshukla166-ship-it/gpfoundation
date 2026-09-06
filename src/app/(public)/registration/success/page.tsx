import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { CATEGORY_LABELS, formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { safeDb } from "@/lib/settings";
import { DownloadReceiptButton } from "@/components/public/download-receipt";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registration Status" };

export default async function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string; status?: string; reason?: string }>;
}) {
  const { applicationId, status, reason } = await searchParams;
  if (status === "failed") {
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

  const registration = await safeDb(
    () =>
      prisma.courseRegistration.findUnique({
        where: { applicationId },
        include: { course: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
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
  const courseName = registration.enrolledCourseName || registration.course.name;
  const address = registration.postalAddress || "—";

  return (
    <Section eyebrow="CONFIRMATION" title={paid ? "Registration successful" : "Registration received"}>
      <div className="max-w-xl space-y-3 border border-line bg-white p-6">
        <p>
          Registration number: <strong className="tracking-wide">{registration.applicationId}</strong>
        </p>
        {registration.studentName ? <p>Name: {registration.studentName}</p> : null}
        <p>Enrolled course: {courseName}</p>
        <p>Examination centre: {examCenterLabel(registration.examCenter)}</p>
        <p>Caste / category: {CATEGORY_LABELS[registration.category]}</p>
        <p>Address: {address}</p>
        <p>Amount paid: {formatInrFromPaise(registration.feePaise)}</p>
        <p>Payment status: {payment?.status || "PENDING"}</p>
      </div>
      {paid && registration.receiptToken ? <DownloadReceiptButton token={registration.receiptToken} /> : null}
      {paid && !registration.receiptToken && registration.receiptDownloadedAt ? (
        <p className="mt-6 text-sm text-muted">
          The receipt has already been downloaded and deleted from the website server. Keep your registration number{" "}
          <strong>{registration.applicationId}</strong>.
        </p>
      ) : null}
      <p className="mt-6 text-sm text-muted">Please save your registration number for all future correspondence with GP Foundation.</p>
    </Section>
  );
}
