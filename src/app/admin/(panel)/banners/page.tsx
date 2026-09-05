import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveBanner } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";

export default async function BannersPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.heroBanner.findMany({ orderBy: { displayOrder: "asc" } }),
    id ? prisma.heroBanner.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveBanner} className="space-y-4">
        <h1 className="font-display text-3xl">Hero Banners</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <Field name="heading" label="Heading" defaultValue={current?.heading} />
        <Field name="subtitle" label="Subtitle" defaultValue={current?.subtitle} />
        <Field name="supporting" label="Supporting text" defaultValue={current?.supporting} />
        <ImageField name="imageUrl" defaultValue={current?.imageUrl} folder="banners" />
        <Field name="ctaLabel" label="CTA label" defaultValue={current?.ctaLabel} />
        <Field name="ctaHref" label="CTA link" defaultValue={current?.ctaHref} />
        <Field name="displayOrder" label="Order" type="number" defaultValue={current?.displayOrder ?? items.length + 1} />
        <Check name="isActive" label="Enabled" defaultChecked={current?.isActive ?? true} />
        <Check name="archived" label="Archived" defaultChecked={current?.archived} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/banners" className="text-sm text-navy underline">New banner</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/banners?id=${item.id}`} className="block border bg-white p-3 text-sm">
            {item.heading || "Banner"} {item.isActive ? "" : "(off)"}
          </Link>
        ))}
      </aside>
    </div>
  );
}
