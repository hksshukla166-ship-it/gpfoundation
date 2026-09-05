import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveCourse } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";

export default async function CoursesAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.course.findMany({ orderBy: { displayOrder: "asc" } }),
    id ? prisma.course.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveCourse} className="space-y-4">
        <h1 className="font-display text-3xl">Courses</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <Field name="name" label="Course name" defaultValue={current?.name} required />
        <Field name="slug" label="Slug" defaultValue={current?.slug} />
        <Field name="shortDescription" label="Short description" defaultValue={current?.shortDescription} textarea />
        <Field name="fullDescription" label="Full description" defaultValue={current?.fullDescription} textarea />
        <ImageField name="imageUrl" defaultValue={current?.imageUrl} folder="courses" />
        <Field name="subjects" label="Subjects (one per line)" defaultValue={current?.subjects.join("\n")} textarea />
        <Field name="duration" label="Duration" defaultValue={current?.duration} />
        <Field name="batchInfo" label="Batch information" defaultValue={current?.batchInfo} />
        <Field name="categoryLabel" label="Category (Integrated Program or Additional Classes)" defaultValue={current?.categoryLabel} />
        <Field name="feeStScPaise" label="ST/SC fee in paise (blank = default)" type="number" defaultValue={current?.feeStScPaise} />
        <Field name="feeObcPaise" label="OBC fee in paise (blank = default)" type="number" defaultValue={current?.feeObcPaise} />
        <Field name="feeGeneralPaise" label="GENERAL fee in paise (blank = default)" type="number" defaultValue={current?.feeGeneralPaise} />
        <Field name="displayOrder" label="Order" type="number" defaultValue={current?.displayOrder ?? items.length + 1} />
        <Check name="admissionOpen" label="Admission open" defaultChecked={current?.admissionOpen ?? true} />
        <Check name="registrationOpen" label="Registration open" defaultChecked={current?.registrationOpen ?? true} />
        <Check name="isActive" label="Enabled" defaultChecked={current?.isActive ?? true} />
        <Check name="archived" label="Archived" defaultChecked={current?.archived} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/courses" className="text-sm underline">New course</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/courses?id=${item.id}`} className="block border bg-white p-3 text-sm">
            <span className="block font-medium">{item.name}</span>
            <span className="text-xs text-muted">
              {item.categoryLabel || "Uncategorized"}
              {item.registrationOpen ? " · registration open" : " · not a main admission program"}
            </span>
          </Link>
        ))}
      </aside>
    </div>
  );
}
