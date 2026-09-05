"use client";

import { useMemo, useState } from "react";
import { formatInrFromPaise } from "@/lib/fees";
import { ADDITIONAL_PREPARATION_OPTIONS, EXAM_CENTERS, examCenterLabel } from "@/lib/catalog";

type Category = "ST_SC" | "OBC" | "GENERAL" | "";
type ExamCenter = (typeof EXAM_CENTERS)[number]["id"] | "";

type MainProgram = { id: string; name: string; slug: string };

export function RegistrationForm({
  course,
  mainPrograms,
  fees,
  razorpayKey,
}: {
  course: MainProgram;
  mainPrograms: MainProgram[];
  fees: { st: number; obc: number; gen: number };
  razorpayKey: string;
}) {
  const [category, setCategory] = useState<Category>("");
  const [examCenter, setExamCenter] = useState<ExamCenter>("");
  const [selectedCourseId, setSelectedCourseId] = useState(course.id);
  const [additional, setAdditional] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedProgram = mainPrograms.find((item) => item.id === selectedCourseId) ?? course;

  const displayFee = useMemo(() => {
    if (category === "ST_SC") return fees.st;
    if (category === "OBC") return fees.obc;
    if (category === "GENERAL") return fees.gen;
    return null;
  }, [category, fees]);

  function toggleAdditional(id: string) {
    setAdditional((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!selectedCourseId) {
      setError("Please select your main program.");
      return;
    }
    if (!category) {
      setError("Please select your category.");
      return;
    }
    if (!examCenter) {
      setError("कृपया परीक्षा केंद्र चुनें।");
      return;
    }
    if (!razorpayKey) {
      setError("Online payment is not configured yet. Please contact the institute.");
      return;
    }
    setPending(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("courseId", selectedCourseId);
    data.set("category", category);
    data.set("examCenter", examCenter);

    const photo = data.get("photo");
    const document = data.get("document");
    let photoUrl = "";
    let documentUrl = "";
    async function uploadFile(file: File, kind: string) {
      const upload = new FormData();
      upload.set("file", file);
      upload.set("kind", kind);
      const up = await fetch("/api/upload/public", { method: "POST", body: upload });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || "Upload failed");
      return upJson.url as string;
    }
    try {
      if (photo instanceof File && photo.size > 0) photoUrl = await uploadFile(photo, "applicant");
      if (document instanceof File && document.size > 0) documentUrl = await uploadFile(document, "document");
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }

    const payload = Object.fromEntries(
      [...data.entries()].filter(([k]) => k !== "photo" && k !== "document" && k !== "additionalPreparations"),
    );
    const res = await fetch("/api/registration/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, photoUrl, documentUrl, additionalPreparations: additional }),
    });
    const json = await res.json();
    if (!res.ok) {
      setPending(false);
      setError(json.error || "Registration failed");
      return;
    }

    const Razorpay = await loadRazorpay();
    const rzp = new Razorpay({
      key: razorpayKey,
      amount: json.amount,
      currency: "INR",
      name: "GP Foundation, Kondagaon",
      description: `${selectedProgram.name} registration`,
      order_id: json.orderId,
      prefill: { name: payload.fullName, email: payload.email, contact: payload.mobile },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const verify = await fetch("/api/registration/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const verified = await verify.json();
        if (!verify.ok) {
          window.location.href = `/registration/success?status=failed&reason=${encodeURIComponent(verified.error || "Verification failed")}`;
          return;
        }
        window.location.href = `/registration/success?applicationId=${verified.applicationId}`;
      },
    });
    rzp.on("payment.failed", () => {
      void fetch("/api/registration/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_order_id: json.orderId }),
      }).finally(() => {
        window.location.href = "/registration/success?status=failed";
      });
    });
    rzp.open();
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 border border-line bg-white p-6 md:grid-cols-2">
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">Select Your Main Program</p>
        <p className="text-xs text-muted">
          GP Foundation में मुख्य रूप से इन्हीं तीन Integrated Programs के लिए Registration/Admission किया जाएगा।
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {mainPrograms.map((program) => (
            <label key={program.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="mainProgram"
                checked={selectedCourseId === program.id}
                onChange={() => setSelectedCourseId(program.id)}
              />
              {program.name}
            </label>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">कृपया अपनी सुविधा के अनुसार एक परीक्षा केंद्र चुनें:</p>
        <div className="mt-3 flex flex-col gap-2">
          {EXAM_CENTERS.map((center) => (
            <label key={center.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="examCenterDisplay"
                checked={examCenter === center.id}
                onChange={() => setExamCenter(center.id)}
                required
              />
              {center.label}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          नोट: परीक्षा केंद्र का चयन Registration/Admission Form भरते समय ही करना अनिवार्य होगा।
        </p>
      </div>
      <div className="md:col-span-2 rounded border border-gold/40 bg-paper p-4">
        <p className="font-medium">Additional Preparation / Classes (Optional)</p>
        <p className="text-xs text-muted">
          अन्य विषय एवं प्रतियोगी परीक्षाओं की तैयारी मुख्य Admission Program नहीं है। अपनी Requirement के अनुसार चुनें।
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ADDITIONAL_PREPARATION_OPTIONS.map((option) => (
            <label key={option.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={additional.includes(option.id)}
                onChange={() => toggleAdditional(option.id)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <Field name="fullName" label="Full Name" required />
      <Field name="fatherName" label="Father's Name" required />
      <Field name="motherName" label="Mother's Name" required />
      <Field name="mobile" label="Mobile Number" required />
      <Field name="email" label="Email" type="email" />
      <Field name="dateOfBirth" label="Date of Birth" type="date" required />
      <label className="text-sm">
        Gender
        <select name="gender" required className="mt-1 w-full border border-line bg-paper px-3 py-2">
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <div className="md:col-span-2 rounded border border-gold/40 bg-paper p-4">
        <p className="font-medium">Select Category</p>
        <p className="text-xs text-muted">You must choose this yourself. It is not selected automatically.</p>
        <div className="mt-3 flex flex-col gap-2">
          {(
            [
              ["ST_SC", "ST/SC", fees.st],
              ["OBC", "OBC", fees.obc],
              ["GENERAL", "GENERAL", fees.gen],
            ] as const
          ).map(([value, label, amount]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="categoryDisplay" checked={category === value} onChange={() => setCategory(value)} />
              {label} — {formatInrFromPaise(amount)}
            </label>
          ))}
        </div>
      </div>
      <label className="md:col-span-2 text-sm">
        Address
        <textarea name="address" required className="mt-1 w-full border border-line bg-paper px-3 py-2" />
      </label>
      <Field name="district" label="District" required />
      <Field name="state" label="State" required />
      <Field name="qualification" label="Educational Qualification" required />
      <Field name="schoolCollege" label="School/College" />
      <label className="text-sm">
        Photo
        <input name="photo" type="file" accept="image/*" className="mt-1 w-full" />
      </label>
      <label className="text-sm">
        Document (optional)
        <input name="document" type="file" accept="image/*" className="mt-1 w-full" />
      </label>
      <div className="md:col-span-2 border border-navy/20 bg-paper p-4">
        <p className="text-xs tracking-widest text-gold">PAYMENT SUMMARY</p>
        <p>Main Program: {selectedProgram.name}</p>
        <p>
          Additional Classes:{" "}
          {additional.length
            ? additional
                .map((id) => ADDITIONAL_PREPARATION_OPTIONS.find((item) => item.id === id)?.label ?? id)
                .join(", ")
            : "None"}
        </p>
        <p>Selected Category: {category ? category.replace("_", "/") : "—"}</p>
        <p>Exam Centre: {examCenter ? examCenterLabel(examCenter) : "—"}</p>
        <p>Registration Fee: {displayFee != null ? formatInrFromPaise(displayFee) : "Select category"}</p>
        <p className="font-semibold">Total Amount: {displayFee != null ? formatInrFromPaise(displayFee) : "—"}</p>
      </div>
      {error ? <p className="md:col-span-2 text-red-700">{error}</p> : null}
      <button disabled={pending} className="md:col-span-2 bg-gold py-3 text-xs font-bold tracking-[0.22em] text-navy">
        {pending ? "PROCESSING..." : "PAY NOW"}
      </button>
    </form>
  );
}

function Field({ name, label, required, type = "text" }: { name: string; label: string; required?: boolean; type?: string }) {
  return (
    <label className="text-sm">
      {label}
      <input name={name} required={required} type={type} className="mt-1 w-full border border-line bg-paper px-3 py-2" />
    </label>
  );
}

function loadRazorpay(): Promise<{ new (options: Record<string, unknown>): { open: () => void; on: (e: string, cb: () => void) => void } }> {
  return new Promise((resolve, reject) => {
    const existing = (window as unknown as { Razorpay?: unknown }).Razorpay;
    if (existing) return resolve(existing as never);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve((window as unknown as { Razorpay: never }).Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(script);
  });
}
