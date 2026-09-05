import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { safeDb } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Faculty" };

export default async function FacultyPage() {
  const faculty = await safeDb(
    () => prisma.faculty.findMany({ where: { isActive: true, archived: false }, orderBy: { displayOrder: "asc" } }),
    [],
  );

  return (
    <Section eyebrow="FACULTY" title="Our Faculty">
      {faculty.length === 0 ? (
        <p className="text-muted">Faculty profiles will be published here once the administrator adds them.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.map((person) => (
            <article key={person.id} className="border border-line bg-white p-5">
              {person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.photoUrl} alt={person.name} className="mb-4 aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="mb-4 grid aspect-[4/5] place-items-center bg-navy text-gold">PHOTO</div>
              )}
              <h2 className="font-display text-2xl">{person.name}</h2>
              {person.subject ? <p className="text-gold">{person.subject}</p> : null}
              {person.qualification ? <p className="text-sm text-muted">{person.qualification}</p> : null}
              {person.experience ? <p className="text-sm">{person.experience}</p> : null}
              {person.biography ? <p className="mt-3 text-sm text-muted">{person.biography}</p> : null}
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
