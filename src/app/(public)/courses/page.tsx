import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { safeDb } from "@/lib/settings";
import { additionalClassCourses, fallbackCourses, mainAdmissionCourses } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Courses",
  description: "Integrated B.Sc., B.Com. and B.A. programs with CGPSC & UPSC, plus optional additional classes at GP Foundation, Kondagaon.",
};

export default async function CoursesPage() {
  const courses = await safeDb(
    () => prisma.course.findMany({ where: { isActive: true, archived: false }, orderBy: { displayOrder: "asc" } }),
    fallbackCourses(),
  );
  const mainPrograms = mainAdmissionCourses(courses);
  const additional = additionalClassCourses(courses);

  return (
    <Section eyebrow="PROGRAMS" title="Courses">
      <p className="max-w-3xl text-muted">
        GP Foundation में मुख्य रूप से तीन Integrated Programs के लिए विद्यार्थियों का Registration/Admission किया जाता है। अन्य तैयारी वाली कक्षाएँ मुख्य Admission Program नहीं हैं — विद्यार्थी इन्हें Additional Classes के रूप में चुन सकते हैं।
      </p>

      <h2 className="mt-10 font-display text-2xl">मुख्य Registration / Admission Programs</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {mainPrograms.map((course, i) => (
          <Link key={course.id} href={`/courses/${course.slug}`} className="border border-line bg-white p-6 hover:border-gold">
            <p className="text-xs tracking-[0.2em] text-gold">{String.fromCharCode(65 + i)} · {course.categoryLabel}</p>
            <h3 className="mt-2 font-display text-2xl">{course.name}</h3>
            <p className="mt-2 text-muted">{course.shortDescription}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">अन्य तैयारी वाले Courses</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        इनका चयन विद्यार्थी अपनी Requirement / Additional Classes के अनुसार कर सकेंगे।
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {additional.map((course) => (
          <Link key={course.id} href={`/courses/${course.slug}`} className="border border-dashed border-line bg-white p-6 hover:border-gold">
            <p className="text-xs tracking-[0.2em] text-gold">{course.categoryLabel}</p>
            <h3 className="mt-2 font-display text-2xl">{course.name}</h3>
            <p className="mt-2 text-muted">{course.shortDescription}</p>
          </Link>
        ))}
      </div>
    </Section>
  );
}
