import Link from "next/link";
import { CourseType, ExaminationGroup, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatInrExact } from "@/lib/fees";
import { EXAM_CENTERS } from "@/lib/catalog";
import { COURSE_TYPES, EXAMINATION_GROUPS, allExams, courseTypeLabel, examinationGroupLabel, examinationLabel, examsForGroup } from "@/lib/exam-groups";
import { ensureRegistrationSchema, prismaErrorMessage } from "@/lib/db-ensure";
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
  searchParams: Promise<{
    q?: string;
    courseId?: string;
    status?: string;
    category?: string;
    examCenter?: string;
    courseType?: string;
    examinationGroup?: string;
    selectedExamination?: string;
    hostel?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const take = 20;
  const where: Prisma.CourseRegistrationWhereInput = {
    ...(sp.courseId ? { courseId: sp.courseId } : {}),
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(sp.category ? { category: sp.category as never } : {}),
    ...(sp.examCenter ? { examCenter: sp.examCenter as never } : {}),
    ...(sp.courseType ? { courseType: sp.courseType as CourseType } : {}),
    ...(sp.examinationGroup ? { examinationGroup: sp.examinationGroup as ExaminationGroup } : {}),
    ...(sp.selectedExamination ? { selectedExamination: sp.selectedExamination } : {}),
    ...(sp.hostel === "yes" ? { hostelRequired: true } : {}),
    ...(sp.hostel === "no" ? { hostelRequired: false } : {}),
    ...(sp.q
      ? {
          OR: [
            { applicationId: { contains: sp.q, mode: "insensitive" } },
            { studentName: { contains: sp.q, mode: "insensitive" } },
            { studentMobile: { contains: sp.q } },
            { fatherName: { contains: sp.q, mode: "insensitive" } },
            { postalAddress: { contains: sp.q, mode: "insensitive" } },
            { enrolledCourseName: { contains: sp.q, mode: "insensitive" } },
            { applicant: { fullName: { contains: sp.q, mode: "insensitive" } } },
            { applicant: { mobile: { contains: sp.q } } },
          ],
        }
      : {}),
  };
  const selectedGroupExams = sp.examinationGroup ? examsForGroup(sp.examinationGroup) : allExams();
  let items: Prisma.CourseRegistrationGetPayload<{
    include: { course: true; applicant: { select: { fullName: true; address: true; district: true; state: true; mobile: true } } };
  }>[] = [];
  let total = 0;
  let courses: { id: string; name: string }[] = [];
  let loadError: string | null = null;
  try {
    await ensureRegistrationSchema().catch(() => undefined);
    [items, total, courses] = await Promise.all([
      prisma.courseRegistration.findMany({
        where,
        include: { course: true, applicant: { select: { fullName: true, address: true, district: true, state: true, mobile: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.courseRegistration.count({ where }),
      prisma.course.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
  } catch (error) {
    loadError = prismaErrorMessage(error);
  }

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
      {loadError ? <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p> : null}
      <form className="my-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Registration number, name, or mobile" className="border px-3 py-2" />
        <select name="courseId" defaultValue={sp.courseId} className="border px-2">
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="courseType" defaultValue={sp.courseType} className="border px-2">
          <option value="">All course types</option>
          {COURSE_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select name="examinationGroup" defaultValue={sp.examinationGroup} className="border px-2">
          <option value="">All examination groups</option>
          {EXAMINATION_GROUPS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select name="selectedExamination" defaultValue={sp.selectedExamination} className="border px-2">
          <option value="">All examinations</option>
          {selectedGroupExams.map((exam, index) => (
            <option key={`${exam.id}-${index}`} value={exam.id}>
              {exam.label}
            </option>
          ))}
        </select>
        <select name="hostel" defaultValue={sp.hostel} className="border px-2">
          <option value="">Hostel: all</option>
          <option value="yes">Hostel: Yes</option>
          <option value="no">Hostel: No</option>
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
          <option value="">All payment statuses</option>
          {["PENDING", "PAYMENT_INITIATED", "PAYMENT_SUCCESSFUL", "PAYMENT_FAILED", "UNDER_REVIEW", "VERIFIED", "CONFIRMED", "REJECTED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="border px-3">Filter</button>
      </form>
      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2 text-left">Registration No.</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Mobile</th>
              <th className="p-2">Course Type</th>
              <th className="p-2">Exam Group</th>
              <th className="p-2">Examination</th>
              <th className="p-2">Hostel</th>
              <th className="p-2">Total</th>
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
                <td className="p-2">{row.studentMobile || row.applicant.mobile || "—"}</td>
                <td className="p-2">{courseTypeLabel(row.courseType)}</td>
                <td className="p-2">{examinationGroupLabel(row.examinationGroup)}</td>
                <td className="p-2">{examinationLabel(row.examinationGroup, row.selectedExamination)}</td>
                <td className="p-2">{row.hostelRequired ? "Yes" : "No"}</td>
                <td className="p-2">{formatInrExact(row.feePaise)}</td>
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
