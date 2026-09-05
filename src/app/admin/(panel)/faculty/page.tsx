import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveFaculty } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";

export default async function FacultyAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.faculty.findMany({ orderBy: { displayOrder: "asc" } }),
    id ? prisma.faculty.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveFaculty} className="space-y-4">
        <h1 className="font-display text-3xl">Faculty</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <Field name="name" label="Teacher name" defaultValue={current?.name} required />
        <Field name="qualification" label="Qualification" defaultValue={current?.qualification} />
        <Field name="subject" label="Subject" defaultValue={current?.subject} />
        <Field name="experience" label="Experience" defaultValue={current?.experience} />
        <ImageField name="photoUrl" defaultValue={current?.photoUrl} folder="faculty" />
        <Field name="biography" label="Short biography" defaultValue={current?.biography} textarea />
        <Field name="displayOrder" label="Order" type="number" defaultValue={current?.displayOrder ?? items.length + 1} />
        <Check name="isActive" label="Enabled" defaultChecked={current?.isActive ?? true} />
        <Check name="archived" label="Archived" defaultChecked={current?.archived} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/faculty" className="text-sm underline">New faculty</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/faculty?id=${item.id}`} className="block border bg-white p-3 text-sm">
            {item.name}
          </Link>
        ))}
      </aside>
    </div>
  );
}
