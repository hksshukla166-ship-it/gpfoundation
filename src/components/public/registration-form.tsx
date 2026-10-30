"use client";

import { useMemo, useState } from "react";
import { formatInrExact, formatInrFromPaise, HOSTEL_REGISTRATION_FEE_PAISE, registrationFeeBreakdown } from "@/lib/fees";
import { ADDITIONAL_PREPARATION_OPTIONS, EXAM_CENTERS, examCenterLabel } from "@/lib/catalog";
import {
  COURSE_TYPES,
  EDUCATION_MEDIUMS,
  EXAMINATION_GROUPS,
  courseTypeLabel,
  examinationLabel,
  examsForGroup,
} from "@/lib/exam-groups";

type Category = "ST_SC" | "OBC" | "GENERAL" | "";
type ExamCenter = (typeof EXAM_CENTERS)[number]["id"] | "";
type CourseType = (typeof COURSE_TYPES)[number]["id"] | "";
type ExamGroup = (typeof EXAMINATION_GROUPS)[number]["id"] | "";

type MainProgram = { id: string; name: string; slug: string };

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

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
  const [courseType, setCourseType] = useState<CourseType>("");
  const [examGroup, setExamGroup] = useState<ExamGroup>("");
  const [selectedExam, setSelectedExam] = useState("");
  const [hostelRequired, setHostelRequired] = useState<boolean | null>(null);
  const [rationHolder, setRationHolder] = useState<boolean | null>(null);
  const [additional, setAdditional] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedProgram = mainPrograms.find((item) => item.id === selectedCourseId) ?? course;
  const groupExams = examsForGroup(examGroup);

  const courseFee = useMemo(() => {
    if (category === "ST_SC") return fees.st;
    if (category === "OBC") return fees.obc;
    if (category === "GENERAL") return fees.gen;
    return null;
  }, [category, fees]);

  const breakdown =
    courseFee != null && hostelRequired != null ? registrationFeeBreakdown(courseFee, hostelRequired) : null;

  function toggleAdditional(id: string) {
    setAdditional((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function onExamGroupChange(next: ExamGroup) {
    setExamGroup(next);
    setSelectedExam("");
  }

  function validateImage(file: File | null, label: string) {
    if (!file || file.size <= 0) return `Please upload the ${label}.`;
    if (file.size > MAX_IMAGE_BYTES) return `${label} must be under 4 MB.`;
    const typeOk = IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!typeOk) return `${label} must be a JPG, PNG, or WebP image.`;
    return null;
  }

  async function uploadImage(file: File, kind: "applicant" | "signature") {
    const upload = new FormData();
    upload.set("file", file);
    upload.set("kind", kind);
    const up = await fetch("/api/upload/public", { method: "POST", body: upload });
    const upJson = await up.json();
    if (!up.ok) throw new Error(upJson.error || `${kind} upload failed`);
    return upJson.url as string;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!selectedCourseId) return setError("Please select your main program.");
    if (!category) return setError("Please select your category.");
    if (!examCenter) return setError("कृपया परीक्षा केंद्र चुनें।");
    if (!courseType) return setError("Please select Crash Course or Regular Course.");
    if (!examGroup) return setError("Please select an examination group.");
    if (!selectedExam) return setError("Please select an examination from the chosen group.");
    if (hostelRequired == null) return setError("Please say whether hostel accommodation is required.");
    if (rationHolder == null) return setError("Please say whether the student has a ration card.");
    if (!razorpayKey) {
      setError("Online payment is not configured yet. Please contact the institute.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const fullName = String(data.get("fullName") || "").trim();
    const fatherName = String(data.get("fatherName") || "").trim();
    const motherName = String(data.get("motherName") || "").trim();
    const mobile = String(data.get("mobile") || "").replace(/\D/g, "").replace(/^91/, "").slice(-10);
    const email = String(data.get("email") || "").trim();
    const dob = String(data.get("dateOfBirth") || "");
    const percentage = Number(data.get("class10Percentage"));
    if (fullName.length < 2) return setError("Please enter the student's full name.");
    if (fatherName.length < 2) return setError("Please enter father's name.");
    if (motherName.length < 2) return setError("Please enter mother's name.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Please enter a valid 10-digit mobile number.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address, or leave it blank.");
    if (!dob) return setError("Please enter a valid date of birth.");
    const dobDate = new Date(dob);
    const minDob = new Date(new Date().getFullYear() - 80, 0, 1);
    const maxDob = new Date(new Date().getFullYear() - 10, new Date().getMonth(), new Date().getDate());
    if (Number.isNaN(dobDate.getTime()) || dobDate < minDob || dobDate > maxDob) {
      return setError("Please enter a valid date of birth.");
    }
    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      return setError("Class 10th percentage must be between 0 and 100.");
    }
    if (rationHolder && String(data.get("rationCardNumber") || "").trim().length < 3) {
      return setError("Please enter the ration card number.");
    }
    const photo = data.get("photo");
    const signature = data.get("signature");
    const photoError = validateImage(photo instanceof File ? photo : null, "student photograph");
    const signatureError = validateImage(signature instanceof File ? signature : null, "student signature");
    if (photoError || signatureError) {
      setError(photoError || signatureError);
      return;
    }

    setPending(true);
    data.set("courseId", selectedCourseId);
    data.set("category", category);
    data.set("examCenter", examCenter);

    try {
      const photoUrl = await uploadImage(photo as File, "applicant");
      const signatureUrl = await uploadImage(signature as File, "signature");
      const payload = Object.fromEntries(
        [...data.entries()].filter(([k]) => k !== "photo" && k !== "signature" && k !== "additionalPreparations"),
      );
      const res = await fetch("/api/registration/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          photoUrl,
          signatureUrl,
          additionalPreparations: additional,
          courseType,
          examinationGroup: examGroup,
          selectedExamination: selectedExam,
          hostelRequired,
          rationCardHolder: rationHolder,
          class10Percentage: payload.class10Percentage,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPending(false);
        setError(json.error || "Registration failed");
        return;
      }

      const Razorpay = await loadRazorpay();
      let paymentCompleted = false;
      const rzp = new Razorpay({
        key: razorpayKey,
        amount: json.amount,
        currency: "INR",
        name: "GP Foundation, Kondagaon",
        description: `${selectedProgram.name} registration`,
        order_id: json.orderId,
        prefill: { name: payload.fullName, contact: payload.mobile },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          paymentCompleted = true;
          let receiptToken = "";
          for (let attempt = 0; attempt < 6; attempt += 1) {
            try {
              const verifyRes = await fetch("/api/registration/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const verifyJson = await verifyRes.json().catch(() => ({}));
              if (verifyRes.ok && verifyJson.paymentStatus === "SUCCESS") {
                receiptToken = typeof verifyJson.receiptToken === "string" ? verifyJson.receiptToken : "";
                break;
              }
              if (verifyRes.status === 409 && attempt < 5) {
                await new Promise((resolve) => window.setTimeout(resolve, 1500));
                continue;
              }
            } catch {
              if (attempt < 5) {
                await new Promise((resolve) => window.setTimeout(resolve, 1500));
              }
            }
          }
          const successUrl = new URL("/registration/success", window.location.origin);
          successUrl.searchParams.set("applicationId", json.applicationId);
          const accessToken = receiptToken || json.receiptToken;
          if (accessToken) successUrl.searchParams.set("receiptToken", accessToken);
          window.location.href = successUrl.toString();
        },
      });
      rzp.on("payment.failed", () => {
        if (paymentCompleted) return;
        const failedUrl = new URL("/registration/success", window.location.origin);
        failedUrl.searchParams.set("applicationId", json.applicationId);
        if (json.receiptToken) failedUrl.searchParams.set("receiptToken", json.receiptToken);
        failedUrl.searchParams.set("status", "pending");
        window.location.href = failedUrl.toString();
      });
      rzp.open();
      setPending(false);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 border border-line bg-white p-6 md:grid-cols-2">
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">किस कोर्स में है / Select Your Main Program</p>
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
        <p className="font-medium">Course Type</p>
        <div className="mt-3 flex flex-col gap-2">
          {COURSE_TYPES.map((item) => (
            <label key={item.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="courseType"
                checked={courseType === item.id}
                onChange={() => setCourseType(item.id)}
                required
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">Examination Group</p>
        <div className="mt-3 flex flex-col gap-2">
          {EXAMINATION_GROUPS.map((group) => (
            <label key={group.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="examinationGroup"
                checked={examGroup === group.id}
                onChange={() => onExamGroupChange(group.id)}
                required
              />
              {group.label}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm">
          Selected Examination
          <select
            value={selectedExam}
            onChange={(event) => setSelectedExam(event.target.value)}
            required
            disabled={!examGroup}
            className="mt-1 w-full border border-line bg-white px-3 py-2"
          >
            <option value="">{examGroup ? "Select examination" : "Select a group first"}</option>
            {groupExams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">Do you require hostel accommodation?</p>
        <div className="mt-3 flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="hostelRequired"
              checked={hostelRequired === true}
              onChange={() => setHostelRequired(true)}
              required
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="hostelRequired"
              checked={hostelRequired === false}
              onChange={() => setHostelRequired(false)}
              required
            />
            No
          </label>
        </div>
      </div>
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">परीक्षा केंद्र</p>
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
      </div>
      <div className="md:col-span-2 rounded border border-gold/40 bg-paper p-4">
        <p className="font-medium">Additional Preparation / Classes (Optional)</p>
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

      <p className="md:col-span-2 text-xs tracking-widest text-gold">PERSONAL DETAILS / व्यक्तिगत विवरण</p>
      <label className="text-sm">
        विद्यार्थी का फोटो
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 w-full" />
      </label>
      <label className="text-sm">
        विद्यार्थी के हस्ताक्षर
        <input name="signature" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 w-full" />
      </label>
      <Field name="fullName" label="विद्यार्थी का पूरा नाम" required />
      <Field name="fatherName" label="पिता का नाम" required />
      <Field name="motherName" label="माता का नाम" required />
      <Field name="mobile" label="मोबाइल नंबर" required inputMode="numeric" />
      <Field name="email" label="Email Address" type="email" />
      <Field name="dateOfBirth" label="Date of Birth" type="date" required />
      <div className="text-sm">
        Medium of Education
        <div className="mt-2 flex gap-4">
          {EDUCATION_MEDIUMS.map((item) => (
            <label key={item.id} className="flex items-center gap-2">
              <input type="radio" name="educationMedium" value={item.id} required />
              {item.label}
            </label>
          ))}
        </div>
      </div>
      <Field name="class10Percentage" label="Class 10th Percentage" type="number" required min="0" max="100" step="0.01" />
      <Field name="batchOrClass" label="कौन-सा बैच/कक्षा" required />
      <div className="md:col-span-2 rounded border border-navy/20 bg-paper p-4">
        <p className="font-medium">Ration Card Holder</p>
        <div className="mt-3 flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="rationCardHolder"
              checked={rationHolder === true}
              onChange={() => setRationHolder(true)}
              required
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="rationCardHolder"
              checked={rationHolder === false}
              onChange={() => setRationHolder(false)}
              required
            />
            No
          </label>
        </div>
        {rationHolder ? <Field name="rationCardNumber" label="Ration Card Number" required className="mt-4" /> : null}
      </div>
      <Field name="aadhaarNumber" label="Aadhaar Card Number" inputMode="numeric" />
      <p className="md:col-span-2 text-xs tracking-widest text-gold">COMPLETE ADDRESS</p>
      <Field name="village" label="Village" required />
      <Field name="postOffice" label="Post Office" required />
      <Field name="tehsil" label="Tehsil" required />
      <Field name="district" label="District" required />
      <Field name="state" label="State" required />
      <label className="md:col-span-2 text-sm">
        Additional address (optional)
        <textarea name="address" className="mt-1 w-full border border-line bg-paper px-3 py-2" />
      </label>
      <div className="md:col-span-2 rounded border border-gold/40 bg-paper p-4">
        <p className="font-medium">Select Category</p>
        <div className="mt-3 flex flex-col gap-2">
          {(
            [
              ["ST_SC", "ST/SC", fees.st],
              ["OBC", "OBC", fees.obc],
              ["GENERAL", "GENERAL", fees.gen],
            ] as const
          ).map(([value, label, amount]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="category"
                checked={category === value}
                onChange={() => setCategory(value)}
                required
              />
              {label} — {formatInrFromPaise(amount)}
            </label>
          ))}
        </div>
      </div>
      <p className="md:col-span-2 text-xs text-muted">
        Enrollment / Student ID registration number भुगतान के बाद अपने आप जारी होगा।
      </p>
      <div className="md:col-span-2 border border-navy/20 bg-paper p-4">
        <p className="text-xs tracking-widest text-gold">PAYMENT SUMMARY</p>
        <p>Main Program: {selectedProgram.name}</p>
        <p>Course Type: {courseType ? courseTypeLabel(courseType) : "—"}</p>
        <p>Examination Group: {EXAMINATION_GROUPS.find((item) => item.id === examGroup)?.label || "—"}</p>
        <p>Selected Examination: {examGroup && selectedExam ? examinationLabel(examGroup, selectedExam) : "—"}</p>
        <p>
          Additional Classes:{" "}
          {additional.length
            ? additional
                .map((id) => ADDITIONAL_PREPARATION_OPTIONS.find((item) => item.id === id)?.label ?? id)
                .join(", ")
            : "None"}
        </p>
        <p>Exam Centre: {examCenter ? examCenterLabel(examCenter) : "—"}</p>
        <p>Hostel Facility: {hostelRequired == null ? "—" : hostelRequired ? "Yes" : "No"}</p>
        <p>Course Registration Fee: {courseFee != null ? formatInrExact(courseFee) : "Select category"}</p>
        <p>
          Hostel Registration Fee:{" "}
          {hostelRequired == null ? "—" : formatInrExact(hostelRequired ? HOSTEL_REGISTRATION_FEE_PAISE : 0)}
        </p>
        <p className="font-semibold">Total Amount: {breakdown ? formatInrExact(breakdown.totalPaise) : "—"}</p>
      </div>
      {error ? <p className="md:col-span-2 text-red-700">{error}</p> : null}
      <button disabled={pending} className="md:col-span-2 bg-gold py-3 text-xs font-bold tracking-[0.22em] text-navy">
        {pending ? "PROCESSING..." : "PAY NOW"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  required,
  type = "text",
  className,
  inputMode,
  min,
  max,
  step,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className={`text-sm ${className || ""}`}>
      {label}
      <input
        name={name}
        required={required}
        type={type}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        className="mt-1 w-full border border-line bg-paper px-3 py-2"
      />
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
