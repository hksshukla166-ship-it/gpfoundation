import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { formatInrExact } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { paymentModeLabel } from "@/lib/payment-status";
import {
  courseTypeLabel,
  examinationGroupLabel,
  examinationLabel,
  FEE_REFUND_NOTICE_HI,
} from "@/lib/exam-groups";
import { nextReceiptNumber } from "@/lib/application-id";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import type { ReceiptView } from "@/lib/receipt-types";

export type { ReceiptView };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseUploadsUrl(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/^\/uploads\/([\w-]+)\/([\w.-]+)$/);
  if (!match) return null;
  return { folder: match[1], filename: match[2] };
}

export function formatPostalAddress(parts: {
  address?: string | null;
  village?: string | null;
  postOffice?: string | null;
  tehsil?: string | null;
  district?: string | null;
  state?: string | null;
}) {
  return [parts.village, parts.postOffice, parts.tehsil, parts.address, parts.district, parts.state]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
}

async function mediaDataUri(url: string | null | undefined) {
  const parsed = parseUploadsUrl(url);
  if (!parsed) return "";
  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: parsed.folder, filename: parsed.filename } },
  });
  if (!file) return "";
  const mime = file.mimeType || "image/jpeg";
  return `data:${mime};base64,${Buffer.from(file.data).toString("base64")}`;
}

function yesNo(value: boolean | null | undefined) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

export async function getReceiptView(registrationId: string): Promise<ReceiptView | null> {
  const existing = await prisma.courseRegistration.findUnique({
    where: { id: registrationId },
    include: {
      applicant: true,
      course: true,
      payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 },
    },
  });
  if (!existing) return null;

  const settings = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
  const payment = existing.payments[0];
  const studentName = existing.studentName || existing.applicant.fullName;
  const fatherName =
    existing.fatherName || existing.applicant.fatherName || existing.guardianName || existing.applicant.guardianName || "—";
  const studentMobile = existing.studentMobile || existing.applicant.mobile || "—";
  const batchOrClass = existing.batchOrClass || existing.course.batchInfo || "—";
  const paidAt = (payment?.paidAt || existing.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const courseFee = existing.courseFeePaise ?? Math.max(0, existing.feePaise - (existing.hostelFeePaise || 0));
  const hostelFee = existing.hostelFeePaise || 0;
  const total = payment?.amountPaise ?? existing.feePaise;
  const [photoSrc, signatureSrc, logoSrc] = await Promise.all([
    mediaDataUri(existing.photoUrl),
    mediaDataUri(existing.signatureUrl),
    mediaDataUri(settings?.logoUrl),
  ]);

  return {
    instituteName: settings?.instituteName || "GP FOUNDATION, KONDAGAON",
    tagline: settings?.tagline || "",
    instituteAddress: settings?.address || "",
    phone: settings?.phone || "",
    email: settings?.email || "",
    logoSrc,
    enrollmentNumber: existing.applicationId,
    receiptNumber: existing.receiptNumber || "—",
    studentName,
    studentMobile,
    fatherName,
    courseName: existing.enrolledCourseName || existing.course.name,
    courseType: courseTypeLabel(existing.courseType),
    examinationGroup: examinationGroupLabel(existing.examinationGroup),
    selectedExamination: examinationLabel(existing.examinationGroup, existing.selectedExamination),
    hostelFacility: yesNo(existing.hostelRequired),
    batchOrClass,
    examCentre: examCenterLabel(existing.examCenter),
    photoSrc,
    signatureSrc,
    courseFeeLabel: formatInrExact(courseFee),
    hostelFeeLabel: formatInrExact(hostelFee),
    amountLabel: formatInrExact(payment?.amountPaise ?? total),
    paidAt,
    paymentMode: paymentModeLabel(payment?.paymentMode),
    paymentStatus: "PAID / SUCCESS",
    paymentId: payment?.razorpayPaymentId || "—",
    transactionId: payment?.razorpayOrderId || "—",
    refundNotice: FEE_REFUND_NOTICE_HI,
  };
}

export function buildReceiptHtml(args: ReceiptView) {
  const photo = args.photoSrc
    ? `<img src="${args.photoSrc}" alt="Student photo" style="width:118px;height:140px;object-fit:cover;border:2px solid #c9a227;background:#eee" />`
    : `<div style="width:118px;height:140px;border:2px dashed #c9a227;display:flex;align-items:center;justify-content:center;font-size:11px;color:#5b6573">No photo</div>`;
  const logo = args.logoSrc
    ? `<img src="${args.logoSrc}" alt="" style="height:52px;width:auto;margin-bottom:8px" />`
    : "";
  const signature = args.signatureSrc
    ? `<img src="${args.signatureSrc}" alt="Signature" style="height:48px;max-width:160px;object-fit:contain" />`
    : "—";

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <title>GP Foundation Receipt — ${escapeHtml(args.receiptNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "Noto Serif", Georgia, "Noto Sans Devanagari", "Nirmala UI", serif; background: #f6f3ec; color: #071529; margin: 0; padding: 16px; }
    .sheet { max-width: 760px; margin: 0 auto; background: #fff; border: 3px solid #c9a227; padding: 28px 32px; }
    .top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .brand { letter-spacing: 0.14em; font-weight: 700; font-size: 22px; }
    .gold { height: 4px; background: linear-gradient(90deg, #c9a227, #e6c35c); margin: 12px 0 18px; }
    h1 { font-size: 18px; margin: 0 0 8px; letter-spacing: 0.12em; }
    h2 { font-size: 14px; letter-spacing: 0.08em; margin: 20px 0 8px; color: #071529; }
    .muted { color: #5b6573; font-size: 13px; }
    .ids { font-size: 15px; font-weight: 700; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #d9d2c3; vertical-align: top; }
    th { width: 42%; color: #5b6573; font-weight: 600; }
    .amount { text-align: right; font-variant-numeric: tabular-nums; }
    .paid { margin-top: 16px; font-size: 18px; }
    .stamp { display: inline-block; margin-top: 10px; padding: 6px 14px; border: 2px solid #1b7a3d; color: #1b7a3d; font-weight: 700; letter-spacing: 0.12em; }
    .notice { margin-top: 22px; border: 2px solid #c9a227; background: #fff8e8; padding: 12px 14px; font-family: "Noto Sans Devanagari", "Nirmala UI", sans-serif; font-size: 13px; line-height: 1.65; }
    .actions { margin: 16px auto; max-width: 760px; display: flex; gap: 10px; }
    .actions a, .actions button { background: #071529; color: #fff; border: 0; padding: 10px 16px; font-size: 12px; letter-spacing: 0.12em; cursor: pointer; text-decoration: none; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border-width: 2px; max-width: none; }
      .actions { display: none !important; }
    }
    @media (max-width: 640px) {
      .sheet { padding: 16px; }
      .top { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button type="button" onclick="window.print()">PRINT RECEIPT</button>
  </div>
  <div class="sheet">
    <div class="top">
      <div>
        ${logo}
        <div class="brand">${escapeHtml(args.instituteName)}</div>
        <p class="muted">${escapeHtml(args.tagline)}</p>
        ${args.instituteAddress ? `<p class="muted">${escapeHtml(args.instituteAddress)}</p>` : ""}
        ${args.phone || args.email ? `<p class="muted">${escapeHtml([args.phone, args.email].filter(Boolean).join(" · "))}</p>` : ""}
      </div>
      ${photo}
    </div>
    <div class="gold"></div>
    <h1>PAYMENT RECEIPT / शुल्क रसीद</h1>
    <p class="ids">Enrollment / Student ID: ${escapeHtml(args.enrollmentNumber)}</p>
    <p class="ids">Receipt Number: ${escapeHtml(args.receiptNumber)}</p>
    <span class="stamp">${escapeHtml(args.paymentStatus)}</span>

    <h2>Student Details / विद्यार्थी विवरण</h2>
    <table>
      <tr><th>विद्यार्थी का पूरा नाम</th><td>${escapeHtml(args.studentName)}</td></tr>
      <tr><th>विद्यार्थी का मोबाइल नंबर</th><td>${escapeHtml(args.studentMobile)}</td></tr>
      <tr><th>पिता का नाम</th><td>${escapeHtml(args.fatherName)}</td></tr>
      <tr><th>किस कोर्स में है</th><td>${escapeHtml(args.courseName)}</td></tr>
      <tr><th>Course Type</th><td>${escapeHtml(args.courseType)}</td></tr>
      <tr><th>Examination Group</th><td>${escapeHtml(args.examinationGroup)}</td></tr>
      <tr><th>Selected Examination</th><td>${escapeHtml(args.selectedExamination)}</td></tr>
      <tr><th>Hostel Facility</th><td>${escapeHtml(args.hostelFacility)}</td></tr>
      <tr><th>कौन-सा बैच/कक्षा</th><td>${escapeHtml(args.batchOrClass)}</td></tr>
      <tr><th>परीक्षा केंद्र</th><td>${escapeHtml(args.examCentre)}</td></tr>
      <tr><th>Enrollment / Registration Number</th><td>${escapeHtml(args.enrollmentNumber)}</td></tr>
      <tr><th>विद्यार्थी के हस्ताक्षर</th><td>${signature}</td></tr>
    </table>

    <h2>Fee Details / शुल्क विवरण</h2>
    <table>
      <tr><th>Description</th><td class="amount">Amount</td></tr>
      <tr><th>Course Registration Fee</th><td class="amount">${escapeHtml(args.courseFeeLabel)}</td></tr>
      <tr><th>Hostel Registration Fee</th><td class="amount">${escapeHtml(args.hostelFeeLabel)}</td></tr>
      <tr><th>Total Amount Paid</th><td class="amount"><strong>${escapeHtml(args.amountLabel)}</strong></td></tr>
    </table>

    <h2>Payment Details / भुगतान विवरण</h2>
    <table>
      <tr><th>भुगतान की तारीख और समय</th><td>${escapeHtml(args.paidAt)}</td></tr>
      <tr><th>Payment Status</th><td>PAID / SUCCESS</td></tr>
      <tr><th>Payment Mode</th><td>${escapeHtml(args.paymentMode)}</td></tr>
      <tr><th>Receipt Number</th><td>${escapeHtml(args.receiptNumber)}</td></tr>
      <tr><th>Transaction / Order ID</th><td>${escapeHtml(args.transactionId)}</td></tr>
      <tr><th>Payment ID</th><td>${escapeHtml(args.paymentId)}</td></tr>
    </table>
    <p class="paid">Amount paid: <strong>${escapeHtml(args.amountLabel)}</strong></p>
    <div class="notice">${escapeHtml(args.refundNotice)}</div>
  </div>
</body>
</html>`;
}

export async function finalizePaidRegistration(registrationId: string) {
  const token = await prisma.$transaction(async (tx) => {
    const existing = await tx.courseRegistration.findUnique({
      where: { id: registrationId },
      include: {
        applicant: true,
        course: true,
        payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 },
      },
    });
    if (!existing) return null;
    if (
      !existing.payments[0] &&
      existing.status !== "PAYMENT_SUCCESSFUL" &&
      existing.status !== "VERIFIED" &&
      existing.status !== "CONFIRMED"
    ) {
      return existing.receiptToken;
    }

    const address =
      existing.postalAddress ||
      formatPostalAddress({
        ...existing.applicant,
        address: existing.applicant.address,
      });
    const courseName = existing.enrolledCourseName || existing.course.name;
    const studentName = existing.studentName || existing.applicant.fullName;
    const guardianName =
      existing.guardianName ||
      existing.applicant.guardianName ||
      existing.applicant.fatherName ||
      existing.applicant.motherName ||
      "—";
    const studentMobile = existing.studentMobile || existing.applicant.mobile || "—";
    const batchOrClass = existing.batchOrClass || existing.course.batchInfo || "—";
    const receiptToken = existing.receiptToken || randomUUID();
    const receiptNumber = existing.receiptNumber || (await nextReceiptNumber(tx));
    const filename = existing.receiptFilename || `${existing.applicationId}.html`;

    await tx.courseRegistration.update({
      where: { id: existing.id },
      data: {
        postalAddress: address,
        enrolledCourseName: courseName,
        studentName,
        guardianName,
        fatherName: existing.fatherName || existing.applicant.fatherName,
        motherName: existing.motherName || existing.applicant.motherName,
        studentMobile,
        batchOrClass,
        receiptNumber,
        receiptToken,
        receiptFilename: filename,
      },
    });
    return receiptToken;
  });
  if (!token) return null;
  const existing = await prisma.courseRegistration.findUnique({ where: { id: registrationId } });
  if (!existing) return token;
  const filename = existing.receiptFilename || `${existing.applicationId}.html`;

  const view = await getReceiptView(existing.id);
  if (view) {
    const html = buildReceiptHtml(view);
    await prisma.mediaFile.upsert({
      where: { folder_filename: { folder: "receipts", filename } },
      create: {
        folder: "receipts",
        filename,
        mimeType: "text/html; charset=utf-8",
        data: Buffer.from(html, "utf8"),
      },
      update: {
        mimeType: "text/html; charset=utf-8",
        data: Buffer.from(html, "utf8"),
      },
    });
  }

  return token;
}

async function receiptBytes(registrationId: string, applicationId: string, format: "pdf" | "html") {
  const view = await getReceiptView(registrationId);
  if (!view) return null;
  if (format === "pdf") {
    const bytes = await buildReceiptPdf(view);
    return {
      bytes,
      mimeType: "application/pdf",
      downloadName: `GP-Foundation-Receipt-${applicationId}.pdf`,
    };
  }
  const html = buildReceiptHtml(view);
  return {
    bytes: Buffer.from(html, "utf8"),
    mimeType: "text/html; charset=utf-8",
    downloadName: `GP-Foundation-Receipt-${applicationId}.html`,
  };
}

export async function getReceiptForDownload(token: string, format: "pdf" | "html" = "pdf") {
  const registration = await prisma.courseRegistration.findUnique({
    where: { receiptToken: token },
    include: { payments: { where: { status: "SUCCESS" }, take: 1 } },
  });
  if (!registration) return null;
  const paid =
    registration.payments.length > 0 ||
    registration.status === "PAYMENT_SUCCESSFUL" ||
    registration.status === "VERIFIED" ||
    registration.status === "CONFIRMED";
  if (!paid) return null;

  if (!registration.receiptNumber || !registration.receiptFilename) {
    await finalizePaidRegistration(registration.id);
  }

  const result = await receiptBytes(registration.id, registration.applicationId, format);
  if (!result) return null;

  await prisma.courseRegistration.update({
    where: { id: registration.id },
    data: { receiptDownloadedAt: new Date() },
  });

  return result;
}
