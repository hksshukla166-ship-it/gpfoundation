import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { formatPostalAddress } from "@/lib/receipt";

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 20;
  const where = q
    ? {
        OR: [
          { applicationId: { contains: q, mode: "insensitive" as const } },
          { studentName: { contains: q, mode: "insensitive" as const } },
          { postalAddress: { contains: q, mode: "insensitive" as const } },
          { enrolledCourseName: { contains: q, mode: "insensitive" as const } },
          { applicant: { fullName: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};
  const items = await prisma.courseRegistration.findMany({
    where,
    include: { course: true, applicant: { select: { fullName: true, address: true, district: true, state: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
  });
  return (
    <div>
      <h1 className="font-display text-3xl">Applicants</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        After payment, admin records keep registration number, name, address, enrolled course, examination centre,
        caste, and amount paid.
      </p>
      <form className="my-4">
        <input name="q" defaultValue={q} placeholder="Registration number or name" className="border px-3 py-2" />
      </form>
      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2 text-left">Registration No.</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Address</th>
              <th className="p-2">Enrolled course</th>
              <th className="p-2">Exam centre</th>
              <th className="p-2">Caste</th>
              <th className="p-2">Amount paid</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const name =
                (row.studentName && row.studentName !== "[REDACTED]" && row.studentName) ||
                (row.applicant.fullName !== "[REDACTED]" ? row.applicant.fullName : "—");
              return (
                <tr key={row.id} className="border-t">
                  <td className="p-2 font-medium">{row.applicationId}</td>
                  <td className="p-2">{name}</td>
                  <td className="p-2">{row.postalAddress || formatPostalAddress(row.applicant)}</td>
                  <td className="p-2">{row.enrolledCourseName || row.course.name}</td>
                  <td className="p-2">{examCenterLabel(row.examCenter)}</td>
                  <td className="p-2">{CATEGORY_LABELS[row.category]}</td>
                  <td className="p-2">{formatInrFromPaise(row.feePaise)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
