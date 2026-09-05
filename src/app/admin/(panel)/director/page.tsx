import { prisma } from "@/lib/prisma";
import { saveDirector } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";

export default async function DirectorAdminPage() {
  const director = await prisma.directorProfile.findFirst({ orderBy: { displayOrder: "asc" } });
  return (
    <form action={saveDirector} className="max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Director</h1>
      <p className="text-sm text-muted">Leave the name and photo empty until the real details are available. The homepage hides an incomplete section.</p>
      <input type="hidden" name="id" value={director?.id || ""} />
      <Field name="name" label="Director name" defaultValue={director?.name} />
      <Field name="designation" label="Designation" defaultValue={director?.designation} />
      <p className="text-sm font-medium">Photograph</p>
      <ImageField name="photoUrl" defaultValue={director?.photoUrl} folder="director" />
      <Field name="shortBio" label="Short introduction" defaultValue={director?.shortBio} textarea />
      <Field name="message" label="Director message" defaultValue={director?.message} textarea />
      <Field name="displayOrder" label="Display order" type="number" defaultValue={director?.displayOrder ?? 1} />
      <Check name="isActive" label="Show on homepage" defaultChecked={director?.isActive ?? true} />
      {director?.photoUrl || director?.name ? (
        <div className="border bg-navy p-6 text-white">
          <p className="text-xs tracking-widest text-gold">PREVIEW</p>
          <p className="mt-2 font-display text-2xl">{director?.name || "Director"}</p>
          <p className="text-gold-2">{director?.designation}</p>
        </div>
      ) : null}
      <SaveBar />
    </form>
  );
}
