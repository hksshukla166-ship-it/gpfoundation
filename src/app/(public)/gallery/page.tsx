import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { Section } from "@/components/public/section";
import { safeDb } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ page?: string; category?: string }> }) {
  const { page: pageRaw, category } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 12;
  const where = {
    isActive: true,
    archived: false,
    ...(category ? { category: category as never } : {}),
  };
  const [items, total] = await Promise.all([
    safeDb(() => prisma.galleryItem.findMany({ where, orderBy: { displayOrder: "asc" }, skip: (page - 1) * take, take }), []),
    safeDb(() => prisma.galleryItem.count({ where }), 0),
  ]);

  return (
    <Section eyebrow="GALLERY" title="Institute Gallery">
      {items.length === 0 ? (
        <p className="text-muted">Gallery images and videos will appear here after they are uploaded from the Admin Portal.</p>
      ) : (
        <GalleryGrid items={items} page={page} total={total} take={take} category={category} />
      )}
    </Section>
  );
}
