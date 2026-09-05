import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveNotice } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";

const types = ["ADMISSION", "RECRUITMENT", "EXAMINATION", "SCHOLARSHIP", "CLASS_SCHEDULE", "TEST_SCHEDULE", "HOLIDAY", "IMPORTANT"];

export default async function NoticesAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.notice.findMany({ orderBy: { createdAt: "desc" } }),
    id ? prisma.notice.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={saveNotice} className="space-y-4">
        <h1 className="font-display text-3xl">Notices</h1>
        <input type="hidden" name="id" value={current?.id || ""} />
        <Field name="title" label="Title" defaultValue={current?.title} required />
        <Field name="slug" label="Slug" defaultValue={current?.slug} />
        <label className="block text-sm">
          Type
          <select name="type" defaultValue={current?.type || "IMPORTANT"} className="mt-1 w-full border px-3 py-2">
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <Field name="excerpt" label="Excerpt" defaultValue={current?.excerpt} />
        <Field name="body" label="Body" defaultValue={current?.body} textarea />
        <Field name="publishAt" label="Schedule publish at" type="datetime-local" defaultValue={current?.publishAt?.toISOString().slice(0, 16)} />
        <Check name="published" label="Published" defaultChecked={current?.published} />
        <Check name="pinned" label="Pinned" defaultChecked={current?.pinned} />
        <Check name="archived" label="Archived" defaultChecked={current?.archived} />
        <SaveBar />
      </form>
      <aside className="space-y-2">
        <Link href="/admin/notices" className="text-sm underline">New notice</Link>
        {items.map((item) => (
          <Link key={item.id} href={`/admin/notices?id=${item.id}`} className="block border bg-white p-3 text-sm">
            {item.title}
          </Link>
        ))}
      </aside>
    </div>
  );
}
