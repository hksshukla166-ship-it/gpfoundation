"use client";

import { useState } from "react";

export function EnquiryForm({
  mainPrograms,
  additionalPrograms,
}: {
  mainPrograms: string[];
  additionalPrograms: string[];
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    setPending(false);
    setStatus(res.ok ? "Enquiry submitted. We will contact you." : data.error || "Could not submit enquiry.");
    if (res.ok) event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-line bg-white p-6">
      <Field name="name" label="Name" required />
      <Field name="mobile" label="Mobile Number" required />
      <Field name="email" label="Email" type="email" />
      <label className="block text-sm">
        Interested Program
        <select name="interestedProgram" className="mt-1 w-full border border-line bg-paper px-3 py-2">
          <option value="">Select</option>
          <optgroup label="Main Registration / Admission Programs">
            {mainPrograms.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </optgroup>
          <optgroup label="Additional Preparation / Classes">
            {additionalPrograms.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="block text-sm">
        Message
        <textarea name="message" required rows={4} className="mt-1 w-full border border-line bg-paper px-3 py-2" />
      </label>
      <button disabled={pending} className="bg-gold px-5 py-3 text-xs font-bold tracking-[0.2em] text-navy">
        {pending ? "SUBMITTING..." : "SUBMIT ENQUIRY"}
      </button>
      {status ? <p className="text-sm">{status}</p> : null}
    </form>
  );
}

function Field({ name, label, required, type = "text" }: { name: string; label: string; required?: boolean; type?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} required={required} type={type} className="mt-1 w-full border border-line bg-paper px-3 py-2" />
    </label>
  );
}
