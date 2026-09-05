import { getSettings } from "@/lib/settings";
import { saveSettings } from "../actions";
import { Check, Field, SaveBar } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";

export default async function WebsiteSettingsPage() {
  const s = await getSettings();
  return (
    <form action={saveSettings} className="max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">Website Settings</h1>
      <Field name="instituteName" label="Institute name" defaultValue={s.instituteName} required />
      <Field name="tagline" label="Tagline" defaultValue={s.tagline} />
      <Field name="phone" label="Phone" defaultValue={s.phone} />
      <Field name="email" label="Email" defaultValue={s.email} />
      <Field name="address" label="Address" defaultValue={s.address} textarea />
      <Field name="footerText" label="Footer text" defaultValue={s.footerText} />
      <Field name="facebookUrl" label="Facebook URL" defaultValue={s.facebookUrl} />
      <Field name="instagramUrl" label="Instagram URL" defaultValue={s.instagramUrl} />
      <Field name="youtubeUrl" label="YouTube URL" defaultValue={s.youtubeUrl} />
      <Field name="whatsappUrl" label="WhatsApp URL" defaultValue={s.whatsappUrl} />
      <Field name="seoTitle" label="SEO title" defaultValue={s.seoTitle} />
      <Field name="seoDescription" label="SEO description" defaultValue={s.seoDescription} textarea />
      <p className="text-sm font-medium">Logo</p>
      <ImageField name="logoUrl" defaultValue={s.logoUrl} folder="brand" />
      <p className="text-sm font-medium">Favicon</p>
      <ImageField name="faviconUrl" defaultValue={s.faviconUrl} folder="brand" />
      <Check name="admissionOpen" label="Admission open" defaultChecked={s.admissionOpen} />
      <Check name="maintenanceMode" label="Maintenance mode" defaultChecked={s.maintenanceMode} />
      <Field name="heroHeading" label="Hero heading" defaultValue={s.heroHeading} />
      <Field name="heroSubheading" label="Hero subheading" defaultValue={s.heroSubheading} />
      <Field name="heroSupporting" label="Hero supporting text" defaultValue={s.heroSupporting} />
      <Field name="joinCtaLabel" label="Join CTA label" defaultValue={s.joinCtaLabel} />
      <Field name="joinCtaHref" label="Join CTA link" defaultValue={s.joinCtaHref} />
      <Field name="enquireCtaLabel" label="Enquire CTA label" defaultValue={s.enquireCtaLabel} />
      <Field name="enquireCtaHref" label="Enquire CTA link" defaultValue={s.enquireCtaHref} />
      <Field name="welcomeHeading" label="Welcome heading" defaultValue={s.welcomeHeading} />
      <Field name="welcomeBody" label="Welcome body" defaultValue={s.welcomeBody} textarea />
      <Field name="welcomeExtra" label="Welcome extra" defaultValue={s.welcomeExtra} textarea />
      <Field name="aboutHeading" label="About heading" defaultValue={s.aboutHeading} />
      <Field name="aboutBody" label="About body" defaultValue={s.aboutBody} textarea />
      <Field name="aboutFocus" label="About focus" defaultValue={s.aboutFocus} textarea />
      <Field name="aboutObjective" label="About objective" defaultValue={s.aboutObjective} textarea />
      <Field name="scholarshipTitle" label="Scholarship title" defaultValue={s.scholarshipTitle} />
      <Field name="scholarshipBody" label="Scholarship body" defaultValue={s.scholarshipBody} textarea />
      <Field name="scholarshipProcess" label="Scholarship process" defaultValue={s.scholarshipProcess} />
      <Field name="writtenHeading" label="Written heading" defaultValue={s.writtenHeading} />
      <Field name="physicalHeading" label="Physical heading" defaultValue={s.physicalHeading} />
      <Field name="physicalNote" label="Physical note" defaultValue={s.physicalNote} textarea />
      <Field name="feeStScPaise" label="ST/SC fee (paise)" type="number" defaultValue={s.feeStScPaise} />
      <Field name="feeObcPaise" label="OBC fee (paise)" type="number" defaultValue={s.feeObcPaise} />
      <Field name="feeGeneralPaise" label="GENERAL fee (paise)" type="number" defaultValue={s.feeGeneralPaise} />
      <SaveBar />
    </form>
  );
}
