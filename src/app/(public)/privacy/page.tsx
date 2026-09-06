import { Section } from "@/components/public/section";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Section title="Privacy Policy">
      <div className="max-w-3xl space-y-4 text-muted">
        <p>GP Foundation, Kondagaon uses registration details to issue a payment receipt and to keep a limited admin record: registration number, name, address, enrolled course, examination centre, caste/category, and amount paid. After you download the receipt, that file is deleted from the website server. Mobile numbers, photos, and other extra form details are not kept in the admin records after a successful payment.</p>
        <p>Payment processing is handled by Razorpay. We do not store Razorpay secret keys in the database.</p>
        <p>For questions, contact foundationgp350@gmail.com or +91-81030 68959.</p>
      </div>
    </Section>
  );
}
