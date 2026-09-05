import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { additionalPreparationLabel } from "@/lib/catalog";
import { updateRegistrationStatus } from "../../actions";

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.courseRegistration.findUnique({
    where: { id },
    include: { applicant: true, course: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!row) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">{row.applicationId}</h1>
      <div className="grid gap-2 bg-white p-5 text-sm">
        <p>Name: {row.applicant.fullName}</p>
        <p>Father: {row.applicant.fatherName}</p>
        <p>Mother: {row.applicant.motherName}</p>
        <p>Mobile: {row.applicant.mobile}</p>
        <p>Email: {row.applicant.email}</p>
        <p>DOB: {row.applicant.dateOfBirth.toLocaleDateString("en-IN")}</p>
        <p>Gender: {row.applicant.gender}</p>
        <p>Address: {row.applicant.address}, {row.applicant.district}, {row.applicant.state}</p>
        <p>Qualification: {row.applicant.qualification}</p>
        <p>Course: {row.course.name}</p>
        <p>
          Additional Classes:{" "}
          {row.additionalPreparations.length
            ? row.additionalPreparations
                .map((id) => additionalPreparationLabel(id))
                .join(", ")
            : "None"}
        </p>
        <p>Category: {row.category.replace("_", "/")}</p>
        <p>Fee: {formatInrFromPaise(row.feePaise)}</p>
        {row.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.photoUrl} alt="" className="h-40 w-32 object-cover" />
        ) : null}
      </div>
      <div className="bg-white p-5 text-sm">
        <p className="font-medium">Payments</p>
        {row.payments.map((p) => (
          <p key={p.id}>
            {p.status} · {formatInrFromPaise(p.amountPaise)} · {p.razorpayOrderId} · {p.razorpayPaymentId}
          </p>
        ))}
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
