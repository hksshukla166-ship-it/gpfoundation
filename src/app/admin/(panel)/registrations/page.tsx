import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel, EXAM_CENTERS } from "@/lib/catalog";
import { registrationPaymentLabel } from "@/lib/payment-status";

function query(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

function studentNameOf(row: { studentName: string | null; applicant: { fullName: string } }) {
  if (row.studentName && row.studentName !== "[REDACTED]") return row.studentName;
  if (row.applicant.fullName && row.applicant.fullName !== "[REDACTED]") return row.applicant.fullName;
  return "—";
}

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; courseId?: string; status?: string; category?: string; examCenter?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const take = 20;
  const where = {
    ...(sp.courseId ? { courseId: sp.courseId } : {}),
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(sp.category ? { category: sp.category as never } : {}),
    ...(sp.examCenter ? { examCenter: sp.examCenter as never } : {}),
    ...(sp.q
      ? {
          OR: [
            { applicationId: { contains: sp.q, mode: "insensitive" as const } },
            { studentName: { contains: sp.q, mode: "insensitive" as const } },
            { postalAddress: { contains: sp.q, mode: "insensitive" as const } },
            { enrolledCourseName: { contains: sp.q, mode: "insensitive" as const } },
            { applicant: { fullName: { contains: sp.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [items, total, courses] = await Promise.all([
    prisma.courseRegistration.findMany({
      where,
      include: { course: true, applicant: { select: { fullName: true, address: true, district: true, state: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.courseRegistration.count({ where }),
    prisma.course.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl">Course Registrations</h1>
        <a href="/api/admin/export/registrations" className="bg-navy px-4 py-2 text-xs tracking-widest text-white">
          EXPORT CSV
        </a>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Enrollment numbers are generated automatically. Payment status shows Pending until the bank confirms, then
        Successful.
      </p>
      <form className="my-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Registration number, name, address, course" className="border px-3 py-2" />
        <select name="courseId" defaultValue={sp.courseId} className="border px-2">
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={sp.category} className="border px-2">
          <option value="">All categories</option>
          <option value="ST_SC">ST/SC</option>
          <option value="OBC">OBC</option>
          <option value="GENERAL">GENERAL</option>
        </select>
        <select name="examCenter" defaultValue={sp.examCenter} className="border px-2">
          <option value="">All exam centres</option>
          {EXAM_CENTERS.map((center) => (
            <option key={center.id} value={center.id}>
              {center.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status} className="border px-2">
          <option value="">All statuses</option>
          {["PENDING", "PAYMENT_INITIATED", "PAYMENT_SUCCESSFUL", "PAYMENT_FAILED", "UNDER_REVIEW", "VERIFIED", "CONFIRMED", "REJECTED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="border px-3">Filter</button>
      </form>
      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2 text-left">Enrollment / Student ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Mobile</th>
              <th className="p-2">Course</th>
              <th className="p-2">Batch / Class</th>
              <th className="p-2">Exam centre</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2 font-medium">{row.applicationId}</td>
                <td className="p-2">{studentNameOf(row)}</td>
                <td className="p-2">{row.studentMobile || "—"}</td>
                <td className="p-2">{row.enrolledCourseName || row.course.name}</td>
                <td className="p-2">{row.batchOrClass || "—"}</td>
                <td className="p-2">{examCenterLabel(row.examCenter)}</td>
                <td className="p-2">{formatInrFromPaise(row.feePaise)}</td>
                <td className="p-2 font-medium">{registrationPaymentLabel(row.status)}</td>
                <td className="p-2">{row.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="p-2">
                  <Link className="underline" href={`/admin/registrations/${row.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs">
        {total} records · page {page} of {Math.max(1, Math.ceil(total / take))}
        {page > 1 ? (
          <a className="ml-3 underline" href={`?${query({ ...sp, page: String(page - 1) })}`}>
            Previous
          </a>
        ) : null}
        {page * take < total ? (
          <a className="ml-3 underline" href={`?${query({ ...sp, page: String(page + 1) })}`}>
            Next
          </a>
        ) : null}
      </p>
    </div>
  );
}
