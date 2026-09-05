import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveGallery } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";

const cats = ["CLASSROOM", "FACULTY", "STUDENTS", "PHYSICAL_TRAINING", "TEST_SERIES", "SEMINAR", "EVENTS", "AWARD", "OTHER"];

export default async function GalleryAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.galleryItem.findMany({ orderBy: { displayOrder: "asc" } }),
    id ? prisma.galleryItem.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveGallery} className="space-y-4">
        <h1 className="font-display text-3xl">Gallery</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <Field name="title" label="Title" defaultValue={current?.title} />
        <ImageField name="mediaUrl" defaultValue={current?.mediaUrl} folder="gallery" />
        <label className="block text-sm">
          Media type
          <select name="mediaType" defaultValue={current?.mediaType || "IMAGE"} className="mt-1 w-full border px-3 py-2">
            <option>IMAGE</option>
            <option>VIDEO</option>
          </select>
        </label>
        <label className="block text-sm">
          Category
          <select name="category" defaultValue={current?.category || "OTHER"} className="mt-1 w-full border px-3 py-2">
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <Field name="displayOrder" label="Order" type="number" defaultValue={current?.displayOrder ?? items.length + 1} />
        <Check name="isActive" label="Enabled" defaultChecked={current?.isActive ?? true} />
        <Check name="archived" label="Archived" defaultChecked={current?.archived} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/gallery" className="text-sm underline">New item</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/gallery?id=${item.id}`} className="block border bg-white p-3 text-sm">
            {item.title || item.category}
          </Link>
        ))}
      </aside>
    </div>
  );
}
