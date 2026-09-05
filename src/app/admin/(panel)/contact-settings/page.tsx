import { getSettings } from "@/lib/settings";
import { saveContactSettings } from "../actions";
import { Field, SaveBar } from "@/components/admin/form";

export default async function ContactSettingsPage() {
  const s = await getSettings();
  return (
    <form action={saveContactSettings} className="max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Contact Settings</h1>
      <Field name="phone" label="Phone" defaultValue={s.phone} />
      <Field name="email" label="Email" defaultValue={s.email} />
      <Field name="address" label="Address" defaultValue={s.address} textarea />
      <Field name="facebookUrl" label="Facebook URL" defaultValue={s.facebookUrl} />
      <Field name="instagramUrl" label="Instagram URL" defaultValue={s.instagramUrl} />
      <Field name="youtubeUrl" label="YouTube URL" defaultValue={s.youtubeUrl} />
      <Field name="whatsappUrl" label="WhatsApp URL" defaultValue={s.whatsappUrl} />
      <SaveBar />
    </form>
  );
}
