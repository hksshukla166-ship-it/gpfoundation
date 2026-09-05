import { Section } from "@/components/public/section";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Section title="Privacy Policy">
      <div className="max-w-3xl space-y-4 text-muted">
        <p>GP Foundation, Kondagaon collects registration and enquiry information only to process admissions, communicate with applicants, and manage institute operations.</p>
        <p>Payment processing is handled by Razorpay. We do not store Razorpay secret keys in the database.</p>
        <p>For questions, contact foundationgp350@gmail.com or +91-81030 68959.</p>
      </div>
    </Section>
  );
}
