import type { Metadata } from "next";
import { getSettings, safeDb } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { additionalClassCourses, fallbackCourses, mainAdmissionCourses } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const [settings, courses] = await Promise.all([
    getSettings(),
    safeDb(
      () =>
        prisma.course.findMany({
          where: { isActive: true, archived: false },
          select: { name: true, categoryLabel: true, registrationOpen: true },
          orderBy: { displayOrder: "asc" },
        }),
      fallbackCourses().map((c) => ({ name: c.name, categoryLabel: c.categoryLabel, registrationOpen: c.registrationOpen })),
    ),
  ]);

  return (
    <Section eyebrow="CONTACT" title={settings.instituteName}>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4 text-muted">
          <p>{settings.address}</p>
          <p>
            Phone:{" "}
            <a className="text-navy underline" href={`tel:${settings.phone.replace(/\s/g, "")}`}>
              {settings.phone}
            </a>
          </p>
          <p>
            Email:{" "}
            <a className="text-navy underline" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          </p>
          <p className="font-display text-xl text-navy">{settings.tagline}</p>
        </div>
        <EnquiryForm
          mainPrograms={mainAdmissionCourses(courses).map((c) => c.name)}
          additionalPrograms={additionalClassCourses(courses).map((c) => c.name)}
        />
      </div>
    </Section>
  );
}
