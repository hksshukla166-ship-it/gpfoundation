import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { additionalPreparationLabel, examCenterLabel } from "@/lib/catalog";

export default async function PrintRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.courseRegistration.findUnique({
    where: { id },
    include: { applicant: true, course: true, payments: { take: 1, orderBy: { createdAt: "desc" } } },
  });
  if (!row) notFound();
  return (
    <div className="mx-auto max-w-2xl bg-white p-10 print:p-0">
      <h1 className="font-brand text-2xl tracking-widest">GP FOUNDATION, KONDAGAON</h1>
      <p>Application ID: {row.applicationId}</p>
      <p>Name: {row.applicant.fullName}</p>
      <p>Course: {row.course.name}</p>
      <p>
        Additional Classes:{" "}
        {row.additionalPreparations.length
          ? row.additionalPreparations.map((id) => additionalPreparationLabel(id)).join(", ")
          : "None"}
      </p>
      <p>Category: {row.category.replace("_", "/")}</p>
      <p>Exam Centre: {examCenterLabel(row.examCenter)}</p>
      <p>Fee: {formatInrFromPaise(row.feePaise)}</p>
      <p>Payment: {row.payments[0]?.status}</p>
      <p>Status: {row.status}</p>
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </div>
  );
}
