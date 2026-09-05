import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { saveHomepageContent, saveNavLink } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";

export default async function WebsiteAdminPage() {
  const [settings, nav] = await Promise.all([
    getSettings(),
    prisma.navLink.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_22rem]">
      <form action={saveHomepageContent} className="max-w-3xl space-y-4">
        <h1 className="font-display text-3xl">Website</h1>
        <p className="text-sm text-muted">Homepage copy. Institute contact and SEO are in Website Settings.</p>
        <Field name="heroHeading" label="Hero heading" defaultValue={settings.heroHeading} />
        <Field name="heroSubheading" label="Hero subheading" defaultValue={settings.heroSubheading} />
        <Field name="heroSupporting" label="Hero supporting text" defaultValue={settings.heroSupporting} />
        <Field name="joinCtaLabel" label="Join CTA label" defaultValue={settings.joinCtaLabel} />
        <Field name="joinCtaHref" label="Join CTA link" defaultValue={settings.joinCtaHref} />
        <Field name="enquireCtaLabel" label="Enquire CTA label" defaultValue={settings.enquireCtaLabel} />
        <Field name="enquireCtaHref" label="Enquire CTA link" defaultValue={settings.enquireCtaHref} />
        <Field name="welcomeHeading" label="Welcome heading" defaultValue={settings.welcomeHeading} />
        <Field name="welcomeBody" label="Welcome body" defaultValue={settings.welcomeBody} textarea />
        <Field name="welcomeExtra" label="Welcome extra" defaultValue={settings.welcomeExtra} textarea />
        <Field name="aboutHeading" label="About heading" defaultValue={settings.aboutHeading} />
        <Field name="aboutBody" label="About body" defaultValue={settings.aboutBody} textarea />
        <Field name="aboutFocus" label="About focus" defaultValue={settings.aboutFocus} textarea />
        <Field name="aboutObjective" label="About objective" defaultValue={settings.aboutObjective} textarea />
        <SaveBar />
      </form>
      <aside className="space-y-4">
        <h2 className="font-display text-xl">Navigation</h2>
        {nav.map((item) => (
          <form key={item.id} action={saveNavLink} className="space-y-2 border bg-white p-3">
            <input type="hidden" name="id" value={item.id} />
            <Field name="label" label="Label" defaultValue={item.label} />
            <Field name="href" label="Link" defaultValue={item.href} />
            <Field name="displayOrder" label="Order" type="number" defaultValue={item.displayOrder} />
            <Check name="isActive" label="Visible" defaultChecked={item.isActive} />
            <SaveBar />
          </form>
        ))}
        <form action={saveNavLink} className="space-y-2 border border-dashed bg-white p-3">
          <p className="text-sm font-medium">Add link</p>
          <Field name="label" label="Label" />
          <Field name="href" label="Link" />
          <Field name="displayOrder" label="Order" type="number" defaultValue={nav.length + 1} />
          <Check name="isActive" label="Visible" defaultChecked />
          <SaveBar />
        </form>
      </aside>
    </div>
  );
}
