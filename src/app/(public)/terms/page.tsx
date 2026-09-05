import { Section } from "@/components/public/section";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <Section title="Terms & Conditions">
      <div className="max-w-3xl space-y-4 text-muted">
        <p>Course registration fees are calculated according to the category selected by the applicant: ST/SC, OBC, or GENERAL.</p>
        <p>Admission confirmation is subject to verification by GP Foundation, Kondagaon.</p>
        <p>The institute does not claim government affiliation unless separately published by the administration.</p>
      </div>
    </Section>
  );
}
