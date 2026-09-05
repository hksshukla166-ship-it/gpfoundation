import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { formatInrFromPaise } from "@/lib/fees";
import { additionalPreparationLabel, examCenterLabel } from "@/lib/catalog";
import { safeDb } from "@/lib/settings";

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

  return (
    <Section eyebrow="CONFIRMATION" title="Registration successful">
      <div className="max-w-xl space-y-3 border border-line bg-white p-6">
        <p>Application ID: <strong>{registration.applicationId}</strong></p>
        <p>Main Program: {registration.course.name}</p>
        <p>
          Additional Classes:{" "}
          {registration.additionalPreparations.length
            ? registration.additionalPreparations.map((id) => additionalPreparationLabel(id)).join(", ")
            : "None"}
        </p>
        <p>Category: {registration.category.replace("_", "/")}</p>
        <p>Exam Centre: {examCenterLabel(registration.examCenter)}</p>
        <p>Fee: {formatInrFromPaise(registration.feePaise)}</p>
        <p>Application status: {registration.status.replaceAll("_", " ")}</p>
        <p>Payment status: {payment?.status || "PENDING"}</p>
      </div>
      <p className="mt-6 text-sm text-muted">Please save your Application ID for future reference.</p>
    </Section>
  );
}
