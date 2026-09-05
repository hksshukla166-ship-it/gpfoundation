import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [
    totalCourses,
    activeCourses,
    totalRegistrations,
    pendingApplications,
    confirmedAdmissions,
    totalEnquiries,
    successfulPayments,
    failedPayments,
    totalGallery,
    activeNotices,
    recentRegs,
  ] = await Promise.all([
    prisma.course.count({ where: { archived: false } }),
    prisma.course.count({ where: { isActive: true, archived: false } }),
    prisma.courseRegistration.count(),
    prisma.courseRegistration.count({ where: { status: { in: ["PENDING", "PAYMENT_INITIATED", "UNDER_REVIEW"] } } }),
    prisma.courseRegistration.count({ where: { status: "CONFIRMED" } }),
    prisma.enquiry.count({ where: { archived: false } }),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.galleryItem.count({ where: { archived: false } }),
    prisma.notice.count({ where: { published: true, archived: false } }),
    prisma.courseRegistration.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const cards = [
    ["Total Courses", totalCourses],
    ["Active Courses", activeCourses],
    ["Total Registrations", totalRegistrations],
    ["Pending Applications", pendingApplications],
    ["Confirmed Admissions", confirmedAdmissions],
    ["Total Enquiries", totalEnquiries],
    ["Successful Payments", successfulPayments],
    ["Failed Payments", failedPayments],
    ["Total Gallery Items", totalGallery],
    ["Active Notices", activeNotices],
  ] as const;

  const maxCount = Math.max(1, ...recentRegs.map((r) => r._count._all));

  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mt-1 text-muted">GP Foundation, Kondagaon — Admin overview</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <article key={label} className="border-t-4 border-gold bg-white p-5 shadow-sm">
            <p className="text-xs tracking-widest text-muted">{label}</p>
            <p className="mt-2 font-brand text-3xl text-navy">{value}</p>
          </article>
        ))}
      </div>
      <section className="mt-10 bg-white p-6">
        <h2 className="font-display text-xl">Applications by status</h2>
        <div className="mt-6 space-y-3">
          {recentRegs.length === 0 ? (
            <p className="text-sm text-muted">No registrations yet.</p>
          ) : (
            recentRegs.map((row) => (
              <div key={row.status} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-3 text-sm">
                <span>{row.status.replaceAll("_", " ")}</span>
                <div className="h-3 bg-paper">
                  <div className="h-3 bg-gold" style={{ width: `${(row._count._all / maxCount) * 100}%` }} />
                </div>
                <span>{row._count._all}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
