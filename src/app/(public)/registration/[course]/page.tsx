import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings, safeDb } from "@/lib/settings";
import { fallbackCourses, INTEGRATED_PROGRAM_LABEL, isMainAdmissionProgram, mainAdmissionCourses } from "@/lib/catalog";
import { Section } from "@/components/public/section";
import { RegistrationForm } from "@/components/public/registration-form";
import { resolveFees } from "@/lib/fees";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const { course } = await params;
  const found = await safeDb(
    () => prisma.course.findUnique({ where: { slug: course } }),
    fallbackCourses().find((item) => item.slug === course) ?? null,
  );
  return { title: found ? `Register — ${found.name}` : "Registration" };
}

export default async function RegistrationPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const [course, mainPrograms, settings] = await Promise.all([
    safeDb(
      () => prisma.course.findFirst({ where: { slug, isActive: true, archived: false } }),
      fallbackCourses().find((item) => item.slug === slug) ?? null,
    ),
    safeDb(
      () =>
        prisma.course.findMany({
          where: { isActive: true, archived: false, registrationOpen: true, categoryLabel: INTEGRATED_PROGRAM_LABEL },
          orderBy: { displayOrder: "asc" },
          select: { id: true, name: true, slug: true },
        }),
      mainAdmissionCourses(fallbackCourses()).map((item) => ({ id: item.id, name: item.name, slug: item.slug })),
    ),
    getSettings(),
  ]);
  if (!course) notFound();
  if (!isMainAdmissionProgram(course) || !settings.admissionOpen) {
    return (
      <Section title="Registration unavailable">
        <p>Registration is not open for this course right now.</p>
      </Section>
    );
  }

  const fees = resolveFees(settings, course);

  return (
    <Section eyebrow="REGISTRATION" title={`Register — ${course.name}`}>
      <RegistrationForm
        course={{ id: course.id, name: course.name, slug: course.slug }}
        mainPrograms={mainPrograms.length ? mainPrograms : [{ id: course.id, name: course.name, slug: course.slug }]}
        fees={{ st: fees.feeStScPaise, obc: fees.feeObcPaise, gen: fees.feeGeneralPaise }}
        razorpayKey={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""}
      />
    </Section>
  );
}
