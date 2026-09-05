import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { getSettings, safeDb } from "@/lib/settings";
import { fallbackCourses, isMainAdmissionProgram } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await safeDb(
    () => prisma.course.findUnique({ where: { slug } }),
    fallbackCourses().find((item) => item.slug === slug) ?? null,
  );
  if (!course) return { title: "Course" };
  return { title: course.name, description: course.shortDescription };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, settings] = await Promise.all([
    safeDb(
      () => prisma.course.findFirst({ where: { slug, isActive: true, archived: false } }),
      fallbackCourses().find((item) => item.slug === slug) ?? null,
    ),
    getSettings(),
  ]);
  if (!course) notFound();

  return (
    <Section eyebrow={course.categoryLabel || "COURSE"} title={course.name}>
      {course.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.imageUrl} alt={course.name} className="mb-8 max-h-80 w-full object-cover" />
      ) : null}
      <p className="max-w-3xl text-lg text-muted">{course.fullDescription}</p>
      {course.duration ? <p className="mt-4">Duration: {course.duration}</p> : null}
      {course.batchInfo ? <p>Batch: {course.batchInfo}</p> : null}
      <h3 className="mt-10 font-display text-2xl">Subjects</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {course.subjects.map((subject) => (
          <li key={subject} className="border border-line bg-white px-4 py-2">
            {subject}
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        {isMainAdmissionProgram(course) ? (
          <Link href={`/registration/${course.slug}`} className="bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-navy">
            REGISTER NOW
          </Link>
        ) : (
          <p className="max-w-2xl text-muted">
            यह मुख्य Admission Program नहीं है। विद्यार्थी इस कक्षा को मुख्य Integrated Program के आवेदन फॉर्म में Additional Preparation / Classes के रूप में चुन सकते हैं।
          </p>
        )}
        {settings.admissionOpen ? (
          <Link href="/admission" className="border border-navy px-6 py-3 text-xs font-bold tracking-[0.2em]">
            ADMISSION INFO
          </Link>
        ) : null}
      </div>
    </Section>
  );
}
