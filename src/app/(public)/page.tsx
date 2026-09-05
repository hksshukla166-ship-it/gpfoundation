import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings, safeDb } from "@/lib/settings";
import { Section } from "@/components/public/section";
import { Hero } from "@/components/public/hero";
import { DirectorBlock } from "@/components/public/director";
import { Shield, BookOpen, GraduationCap, Target } from "lucide-react";
import {
  fallbackCourses,
  FALLBACK_FEATURE_BLOCKS,
  FALLBACK_MATERIAL_BLOCKS,
  FALLBACK_PHYSICAL_BLOCKS,
  FALLBACK_TEST_BLOCKS,
  FALLBACK_WHY_BLOCKS,
  FALLBACK_WRITTEN_BLOCKS,
  INTEGRATED_PROGRAM_LABEL,
  mainAdmissionCourses,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, banners, director, courses, features, why, written, physical, tests, materials, notices] = await Promise.all([
    getSettings(),
    safeDb(() => prisma.heroBanner.findMany({ where: { isActive: true, archived: false }, orderBy: { displayOrder: "asc" } }), []),
    safeDb(() => prisma.directorProfile.findFirst({ orderBy: { displayOrder: "asc" } }), null),
    safeDb(
      () =>
        prisma.course.findMany({
          where: { isActive: true, archived: false, categoryLabel: INTEGRATED_PROGRAM_LABEL },
          orderBy: { displayOrder: "asc" },
          take: 3,
        }),
      mainAdmissionCourses(fallbackCourses()),
    ),
    safeDb(() => prisma.contentBlock.findMany({ where: { kind: "FEATURE", isActive: true }, orderBy: { displayOrder: "asc" } }), FALLBACK_FEATURE_BLOCKS),
    safeDb(() => prisma.contentBlock.findMany({ where: { kind: "WHY_US", isActive: true }, orderBy: { displayOrder: "asc" } }), FALLBACK_WHY_BLOCKS),
    safeDb(() => prisma.contentBlock.findMany({ where: { kind: "WRITTEN_SUBJECT", isActive: true }, orderBy: { displayOrder: "asc" } }), FALLBACK_WRITTEN_BLOCKS),
    safeDb(() => prisma.contentBlock.findMany({ where: { kind: "PHYSICAL_ITEM", isActive: true }, orderBy: { displayOrder: "asc" } }), FALLBACK_PHYSICAL_BLOCKS),
    safeDb(() => prisma.contentBlock.findMany({ where: { kind: "TEST_SERIES", isActive: true }, orderBy: { displayOrder: "asc" } }), FALLBACK_TEST_BLOCKS),
    safeDb(() => prisma.contentBlock.findMany({ where: { kind: "STUDY_MATERIAL", isActive: true }, orderBy: { displayOrder: "asc" } }), FALLBACK_MATERIAL_BLOCKS),
    safeDb(
      () =>
        prisma.notice.findMany({
          where: { published: true, archived: false, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          take: 4,
        }),
      [],
    ),
  ]);

  return (
    <>
      <Hero settings={settings} banners={banners} />

      <Section eyebrow="WELCOME" title={settings.welcomeHeading}>
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 text-lg leading-relaxed text-muted">
            <p>{settings.welcomeBody}</p>
            <p>{settings.welcomeExtra}</p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: GraduationCap, label: "B.Sc. · B.Com. · B.A." },
              { icon: Target, label: "CGPSC & UPSC preparation" },
              { icon: BookOpen, label: "Additional classes" },
              { icon: Shield, label: "Exam-focused guidance" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 border border-line bg-white px-4 py-3">
                <item.icon className="size-5 text-gold" />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <DirectorBlock director={director} />

      <Section eyebrow="KEY FEATURES" title="गुणवत्तापूर्ण तैयारी के स्तंभ" dark>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <article key={item.id} className="border border-white/10 bg-navy-2 p-5">
              <p className="font-display text-lg text-gold-2">{item.title}</p>
              {item.description ? <p className="mt-2 text-sm text-white/70">{item.description}</p> : null}
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="COURSES" title="मुख्य Integrated Programs">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="group border border-line bg-white p-5 hover:border-gold">
              <p className="text-xs tracking-[0.2em] text-gold">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-display text-xl">{course.name}</h3>
              <p className="mt-2 text-sm text-muted">{course.shortDescription}</p>
              <span className="mt-4 inline-block text-xs font-semibold tracking-widest text-navy group-hover:text-gold">VIEW PROGRAM →</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/courses" className="inline-block border border-navy px-6 py-3 text-xs font-bold tracking-[0.2em] hover:bg-navy hover:text-white">
            ALL COURSES
          </Link>
        </div>
      </Section>

      <section className="bg-gold">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.28em] text-navy">ADMISSION</p>
            <h2 className="mt-2 font-display text-3xl text-navy md:text-4xl">अपना कोर्स चुनें और आज ही पंजीकरण करें</h2>
            <p className="mt-2 text-navy/80">ST/SC ₹1,000 · OBC ₹1,250 · GENERAL ₹1,350</p>
          </div>
          <Link href="/admission" className="bg-navy px-7 py-3 text-xs font-bold tracking-[0.22em] text-white hover:bg-navy-2">
            REGISTER NOW
          </Link>
        </div>
      </section>

      <Section eyebrow="WRITTEN" title={settings.writtenHeading}>
        <div className="flex flex-wrap gap-3">
          {written.map((item) => (
            <span key={item.id} className="border border-line bg-white px-4 py-2 text-sm">
              {item.title}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow="PHYSICAL" title={settings.physicalHeading} dark>
        <p className="max-w-3xl text-white/75">{settings.physicalNote}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {physical.map((item) => (
            <div key={item.id} className="border border-gold/30 bg-navy-2 p-5">
              {item.title}
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="TEST SERIES" title="नियमित मूल्यांकन">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tests.map((item) => (
            <div key={item.id} className="border-t-2 border-gold bg-white p-5 shadow-sm">
              {item.title}
            </div>
          ))}
        </div>
      </Section>

      {materials.length ? (
        <Section eyebrow="STUDY MATERIAL" title="अध्ययन सामग्री">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((item) => (
              <div key={item.id} className="border border-line bg-white p-5">
                <p className="font-display text-xl">{item.title}</p>
                {item.description ? <p className="mt-2 text-sm text-muted">{item.description}</p> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section eyebrow="WHY GP FOUNDATION" title="क्यों GP Foundation?" dark>
        <ul className="grid gap-3 sm:grid-cols-2">
          {why.map((item) => (
            <li key={item.id} className="flex gap-3 text-white/90">
              <span className="text-gold">★</span>
              {item.title}
            </li>
          ))}
        </ul>
      </Section>

      {notices.length ? (
        <Section eyebrow="NOTICE BOARD" title="Latest Notices">
          <div className="divide-y border border-line bg-white">
            {notices.map((notice) => (
              <Link key={notice.id} href={`/notice/${notice.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-paper">
                <span>
                  {notice.pinned ? <span className="mr-2 text-xs text-gold">PINNED</span> : null}
                  {notice.title}
                </span>
                <span className="text-xs text-muted">{notice.createdAt.toLocaleDateString("en-IN")}</span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
