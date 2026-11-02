import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatInrExact } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";
import { paymentModeLabel, paymentStatusLabel, registrationPaymentLabel } from "@/lib/payment-status";
import { courseTypeLabel, educationMediumLabel, examinationGroupLabel, examinationLabel } from "@/lib/exam-groups";
import { maskAadhaar, maskRationNumber } from "@/lib/pii";
import { updateRegistrationStatus } from "../../actions";
import { ensureRegistrationSchema, prismaErrorMessage } from "@/lib/db-ensure";

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let row: Prisma.CourseRegistrationGetPayload<{
    include: { course: true; applicant: true; payments: true };
  }> | null = null;
  try {
    await ensureRegistrationSchema().catch(() => undefined);
    row = await prisma.courseRegistration.findUnique({
      where: { id },
      include: {
        course: true,
        applicant: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  } catch (error) {
    return (
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl">Course registration</h1>
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{prismaErrorMessage(error)}</p>
      </div>
    );
  }
  if (!row) notFound();

  const name = row.studentName || row.applicant.fullName;
  const payment = row.payments[0];
  const paid = row.status === "PAYMENT_SUCCESSFUL" || payment?.status === "SUCCESS";
  const courseFee = row.courseFeePaise ?? Math.max(0, row.feePaise - (row.hostelFeePaise || 0));
  const hostelFee = row.hostelFeePaise || 0;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">{row.applicationId}</h1>
      <div className="grid gap-2 bg-white p-5 text-sm">
        <div className="mb-3 flex gap-4">
          {row.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.photoUrl} alt={name} className="h-36 w-28 object-cover border" />
          ) : null}
          {row.signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.signatureUrl} alt="Student signature" className="h-20 max-w-[180px] object-contain border bg-paper p-2" />
          ) : null}
        </div>
        <p>
          Registration Number: <strong>{row.applicationId}</strong>
        </p>
        {row.receiptNumber ? (
          <p>
            Receipt Number: <strong>{row.receiptNumber}</strong>
          </p>
        ) : null}
        <p>Student Name: {name}</p>
        <p>Father&apos;s Name: {row.fatherName || row.applicant.fatherName || row.guardianName || "—"}</p>
        <p>Mother&apos;s Name: {row.motherName || row.applicant.motherName || "—"}</p>
        <p>Mobile: {row.studentMobile || row.applicant.mobile}</p>
        <p>Email: {row.applicant.email || "—"}</p>
        <p>Date of Birth: {row.applicant.dateOfBirth.toLocaleDateString("en-IN", { timeZone: "UTC" })}</p>
        <p>Education Medium: {educationMediumLabel(row.applicant.educationMedium)}</p>
        <p>Class 10th Percentage: {row.applicant.class10Percentage ?? "—"}</p>
        <p>Ration Card Holder: {row.applicant.rationCardHolder == null ? "—" : row.applicant.rationCardHolder ? "Yes" : "No"}</p>
        <p>Ration Card Number: {row.applicant.rationCardNumber || "—"}</p>
        <p>Aadhaar Number: {row.applicant.aadhaarNumber || "—"}</p>
        <p className="text-xs text-muted">
          Full ration card and Aadhaar values are visible only on this confidential student record. Lists and exports
          show masked values ({maskRationNumber(row.applicant.rationCardNumber)} / {maskAadhaar(row.applicant.aadhaarNumber)}).
        </p>
        <p>Village: {row.applicant.village || "—"}</p>
        <p>Post Office: {row.applicant.postOffice || "—"}</p>
        <p>Tehsil: {row.applicant.tehsil || "—"}</p>
        <p>District: {row.applicant.district || "—"}</p>
        <p>State: {row.applicant.state || "—"}</p>
        <p>Address: {row.postalAddress || formatPostalAddress(row.applicant)}</p>
        <p>कोर्स: {row.enrolledCourseName || row.course.name}</p>
        <p>Course Type: {courseTypeLabel(row.courseType)}</p>
        <p>Examination Group: {examinationGroupLabel(row.examinationGroup)}</p>
        <p>Selected Examination: {examinationLabel(row.examinationGroup, row.selectedExamination)}</p>
        <p>Hostel Requirement: {row.hostelRequired ? "Yes" : "No"}</p>
        <p>बैच/कक्षा: {row.batchOrClass || "—"}</p>
        <p>परीक्षा केंद्र: {examCenterLabel(row.examCenter)}</p>
        <p>Course Registration Fee: {formatInrExact(courseFee)}</p>
        <p>Hostel Registration Fee: {formatInrExact(hostelFee)}</p>
        <p>Total Amount: {formatInrExact(payment?.amountPaise ?? row.feePaise)}</p>
        <p>Payment Status: {paid ? "Successful" : registrationPaymentLabel(row.status)}</p>
        <p>Registration Date: {row.createdAt.toLocaleString("en-IN")}</p>
        {payment ? (
          <>
            <p>Payment record: {paymentStatusLabel(payment.status)}</p>
            <p>Payment ID: {payment.razorpayPaymentId || "—"}</p>
            <p>Payment Mode: {paymentModeLabel(payment.paymentMode)}</p>
            <p>Date & time: {(payment.paidAt || payment.createdAt).toLocaleString("en-IN")}</p>
          </>
        ) : null}
        {row.receiptToken && paid ? (
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
