import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveContent } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";

const kinds = ["FEATURE", "WHY_US", "WRITTEN_SUBJECT", "PHYSICAL_ITEM", "TEST_SERIES", "STUDY_MATERIAL"];

export default async function ContentAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.contentBlock.findMany({ orderBy: [{ kind: "asc" }, { displayOrder: "asc" }] }),
    id ? prisma.contentBlock.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveContent} className="space-y-4">
        <h1 className="font-display text-3xl">Homepage content</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <label className="block text-sm">
          Kind
          <select name="kind" defaultValue={current?.kind || "FEATURE"} className="mt-1 w-full border px-3 py-2">
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <Field name="title" label="Title" defaultValue={current?.title} required />
        <Field name="description" label="Description" defaultValue={current?.description} textarea />
        <Field name="displayOrder" label="Order" type="number" defaultValue={current?.displayOrder ?? 1} />
        <Check name="isActive" label="Enabled" defaultChecked={current?.isActive ?? true} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/content" className="text-sm underline">New</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/content?id=${item.id}`} className="block border bg-white p-3 text-sm">
            {item.kind}: {item.title}
          </Link>
        ))}
      </aside>
    </div>
  );
}
