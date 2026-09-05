import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { safeDb } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notices" };

export default async function NoticePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 12;
  const where = {
    published: true,
    archived: false,
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
  };
  const [items, total] = await Promise.all([
    safeDb(
      () => prisma.notice.findMany({ where, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], skip: (page - 1) * take, take }),
      [],
    ),
    safeDb(() => prisma.notice.count({ where }), 0),
  ]);
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <Section eyebrow="NOTICE BOARD" title="Latest Notices">
      {items.length === 0 ? (
        <p className="text-muted">No notices have been published yet.</p>
      ) : (
        <div className="divide-y border border-line bg-white">
          {items.map((notice) => (
            <Link key={notice.id} href={`/notice/${notice.slug}`} className="block px-5 py-4 hover:bg-paper">
              <p className="text-xs tracking-widest text-gold">{notice.type.replaceAll("_", " ")}</p>
              <p className="font-medium">{notice.pinned ? "📌 " : ""}{notice.title}</p>
              {notice.excerpt ? <p className="text-sm text-muted">{notice.excerpt}</p> : null}
            </Link>
          ))}
        </div>
      )}
      {pages > 1 ? (
        <div className="mt-6 flex gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <Link key={i} href={`/notice?page=${i + 1}`} className="border px-3 py-1 text-sm">
              {i + 1}
            </Link>
          ))}
        </div>
      ) : null}
    </Section>
  );
}
