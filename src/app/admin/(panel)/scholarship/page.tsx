import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveScholarship } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";

export default async function ScholarshipAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.scholarship.findMany({ orderBy: { displayOrder: "asc" } }),
    id ? prisma.scholarship.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveScholarship} className="space-y-4">
        <h1 className="font-display text-3xl">Scholarship</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <Field name="title" label="Title" defaultValue={current?.title} required />
        <Field name="body" label="Body" defaultValue={current?.body} textarea />
        <Field name="process" label="Process" defaultValue={current?.process} />
        <Field name="displayOrder" label="Order" type="number" defaultValue={current?.displayOrder ?? 1} />
        <Check name="isActive" label="Enabled" defaultChecked={current?.isActive ?? true} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/scholarship" className="text-sm underline">New</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/scholarship?id=${item.id}`} className="block border bg-white p-3 text-sm">
            {item.title}
          </Link>
        ))}
      </aside>
    </div>
  );
}
