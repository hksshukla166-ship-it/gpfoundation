import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSettings, safeDb } from "@/lib/settings";
import { Section } from "@/components/public/section";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scholarship" };

export default async function ScholarshipPage() {
  const [settings, items] = await Promise.all([
    getSettings(),
    safeDb(() => prisma.scholarship.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }), []),
  ]);

  return (
    <Section eyebrow="SCHOLARSHIP" title={settings.scholarshipTitle}>
      <p className="max-w-3xl text-lg text-muted">{settings.scholarshipBody}</p>
      <p className="mt-6 font-medium">Process: {settings.scholarshipProcess}</p>
      <div className="mt-10 space-y-6">
        {items.map((item) => (
          <article key={item.id} className="border border-line bg-white p-6">
            <h2 className="font-display text-2xl">{item.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-muted">{item.body}</p>
            {item.process ? <p className="mt-3 text-sm">Process: {item.process}</p> : null}
          </article>
        ))}
      </div>
    </Section>
  );
}
