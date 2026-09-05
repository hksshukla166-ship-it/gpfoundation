import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings, safeDb } from "@/lib/settings";
import { fallbackCourses, INTEGRATED_PROGRAM_LABEL, mainAdmissionCourses } from "@/lib/catalog";
import { Section } from "@/components/public/section";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admission", description: "Integrated program registration for GP Foundation, Kondagaon." };

export default async function AdmissionPage() {
  const [settings, courses] = await Promise.all([
    getSettings(),
    safeDb(
      () =>
        prisma.course.findMany({
          where: { isActive: true, archived: false, registrationOpen: true, categoryLabel: INTEGRATED_PROGRAM_LABEL },
          orderBy: { displayOrder: "asc" },
        }),
      mainAdmissionCourses(fallbackCourses()),
    ),
  ]);

  return (
    <Section eyebrow="ADMISSION" title="Admission Open">
      {!settings.admissionOpen ? (
        <p>Admissions are currently closed. Please check notices or contact the institute.</p>
      ) : (
        <>
          <p className="max-w-3xl text-muted">
            Select Your Main Program. GP Foundation में मुख्य रूप से इन्हीं तीन Integrated Programs के लिए Registration/Admission किया जाएगा। Fees: ST/SC ₹1,000 · OBC ₹1,250 · GENERAL ₹1,350.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Additional Preparation / Classes (Optional): CGPSC, UPSC, NEET, JEE, School/Board Preparation, Commerce Foundation, Arts Foundation — आवेदन फॉर्म में चुनें।
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between border border-line bg-white p-5">
                <div>
                  <p className="font-display text-xl">{course.name}</p>
                  <p className="text-sm text-muted">{course.shortDescription}</p>
                </div>
                <Link href={`/registration/${course.slug}`} className="shrink-0 bg-navy px-4 py-2 text-xs font-bold tracking-widest text-white">
                  APPLY NOW
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
