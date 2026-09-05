import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/public/section";
import { safeDb } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const notice = await safeDb(() => prisma.notice.findUnique({ where: { slug } }), null);
  return { title: notice?.title || "Notice" };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notice = await safeDb(
    () => prisma.notice.findFirst({ where: { slug, published: true, archived: false } }),
    null,
  );
  if (!notice) notFound();

  return (
    <Section eyebrow={notice.type.replaceAll("_", " ")} title={notice.title}>
      <p className="text-sm text-muted">{notice.createdAt.toLocaleDateString("en-IN")}</p>
      <article className="prose mt-6 max-w-3xl whitespace-pre-wrap">{notice.body}</article>
    </Section>
  );
}
