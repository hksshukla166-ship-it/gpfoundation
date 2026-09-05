import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Section } from "@/components/public/section";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "About", description: "GP Foundation, Kondagaon — संस्थान का उद्देश्य एवं कार्यक्षेत्र।" };
}

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <Section eyebrow="ABOUT US" title={settings.aboutHeading}>
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-3xl space-y-6 text-lg leading-relaxed text-muted">
          <p>{settings.aboutBody}</p>
          <p>{settings.aboutFocus}</p>
          <p>{settings.aboutObjective}</p>
        </div>
        <aside className="border border-gold/40 bg-navy p-8 text-white">
          <p className="text-xs tracking-[0.28em] text-gold">FOCUS AREAS</p>
          <ul className="mt-5 space-y-3 text-white/85">
            {["B.Sc. + CGPSC + UPSC", "B.Com. + CGPSC + UPSC", "B.A. + CGPSC + UPSC", "Additional Classes", "CGPSC / UPSC", "NEET / JEE / Board"].map((item) => (
              <li key={item} className="border-b border-white/10 pb-2">
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Section>
  );
}
