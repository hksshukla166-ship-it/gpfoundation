import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { examCenterLabel } from "@/lib/catalog";
import { paymentModeLabel } from "@/lib/payment-status";

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

export function formatPostalAddress(parts: { address: string; district: string; state: string }) {
  return [parts.address, parts.district, parts.state].filter(Boolean).join(", ");
}

async function photoDataUri(photoUrl: string | null | undefined) {
  const parsed = parseUploadsUrl(photoUrl);
  if (!parsed) return "";
  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: parsed.folder, filename: parsed.filename } },
  });
  if (!file) return "";
  const mime = file.mimeType || "image/jpeg";
  return `data:${mime};base64,${Buffer.from(file.data).toString("base64")}`;
}

function buildReceiptHtml(args: {
  instituteName: string;
  tagline: string;
  instituteAddress: string;
  phone: string;
  email: string;
  enrollmentNumber: string;
  receiptNumber: string;
  studentName: string;
  studentMobile: string;
  guardianName: string;
  courseName: string;
  batchOrClass: string;
  examCentre: string;
  photoSrc: string;
  amountLabel: string;
  paidAt: string;
  paymentMode: string;
  paymentStatus: string;
}) {
  const photo = args.photoSrc
    ? `<img src="${args.photoSrc}" alt="Student photo" style="width:118px;height:140px;object-fit:cover;border:2px solid #c9a227;background:#eee" />`
    : `<div style="width:118px;height:140px;border:2px dashed #c9a227;display:flex;align-items:center;justify-content:center;font-size:11px;color:#5b6573">No photo</div>`;

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <title>GP Foundation Receipt — ${escapeHtml(args.receiptNumber)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; background: #f6f3ec; color: #071529; margin: 0; padding: 24px; }
    .sheet { max-width: 760px; margin: 0 auto; background: #fff; border: 3px solid #c9a227; padding: 32px 36px; }
    .top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .brand { letter-spacing: 0.18em; font-weight: 700; font-size: 22px; }
    .gold { height: 4px; background: linear-gradient(90deg, #c9a227, #e6c35c); margin: 12px 0 18px; }
    h1 { font-size: 18px; margin: 0 0 8px; letter-spacing: 0.12em; }
    h2 { font-size: 14px; letter-spacing: 0.08em; margin: 22px 0 8px; color: #071529; }
    .muted { color: #5b6573; font-size: 13px; }
    .ids { font-size: 15px; font-weight: 700; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 9px 8px; border-bottom: 1px solid #d9d2c3; vertical-align: top; }
    th { width: 42%; color: #5b6573; font-weight: 600; }
    .paid { margin-top: 16px; font-size: 18px; }
    .stamp { display: inline-block; margin-top: 10px; padding: 6px 14px; border: 2px solid #1b7a3d; color: #1b7a3d; font-weight: 700; letter-spacing: 0.12em; }
    .note { margin-top: 28px; font-size: 12px; color: #5b6573; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">${escapeHtml(args.instituteName)}</div>
        <p class="muted">${escapeHtml(args.tagline)}</p>
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
      <tr><th>माता/पिता/अभिभावक का नाम</th><td>${escapeHtml(args.guardianName)}</td></tr>
      <tr><th>किस कोर्स में है</th><td>${escapeHtml(args.courseName)}</td></tr>
      <tr><th>कौन-सा बैच/कक्षा</th><td>${escapeHtml(args.batchOrClass)}</td></tr>
      <tr><th>परीक्षा केंद्र</th><td>${escapeHtml(args.examCentre)}</td></tr>
      <tr><th>Enrollment / Registration Number</th><td>${escapeHtml(args.enrollmentNumber)}</td></tr>
    </table>

    <h2>Payment Details / भुगतान विवरण</h2>
    <table>
      <tr><th>भुगतान की तारीख और समय</th><td>${escapeHtml(args.paidAt)}</td></tr>
      <tr><th>भुगतान की गई राशि</th><td>${escapeHtml(args.amountLabel)}</td></tr>
      <tr><th>Payment Status</th><td>PAID / SUCCESS</td></tr>
      <tr><th>Payment Mode</th><td>${escapeHtml(args.paymentMode)}</td></tr>
      <tr><th>Receipt Number</th><td>${escapeHtml(args.receiptNumber)}</td></tr>
    </table>
    <p class="paid">Amount paid: <strong>${escapeHtml(args.amountLabel)}</strong></p>

    <h2>Contact Details / संपर्क</h2>
    <table>
      <tr><th>GP Foundation Office / Group Admin Mobile</th><td>${escapeHtml(args.phone)}</td></tr>
      <tr><th>संस्थान का पता</th><td>${escapeHtml(args.instituteAddress)}</td></tr>
      <tr><th>Email</th><td>${escapeHtml(args.email)}</td></tr>
    </table>
    <p class="note">This is an official fee receipt from GP Foundation, Kondagaon. Please keep this file and quote your enrollment number for all future correspondence.</p>
  </div>
</body>
</html>`;
}

export async function finalizePaidRegistration(registrationId: string) {
  const existing = await prisma.courseRegistration.findUnique({
    where: { id: registrationId },
    include: {
      applicant: true,
      course: true,
      payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 },
    },
  });
  if (!existing) return null;

  if (existing.receiptToken && existing.receiptFilename) {
    const file = await prisma.mediaFile.findUnique({
      where: { folder_filename: { folder: "receipts", filename: existing.receiptFilename } },
    });
    if (file) return existing.receiptToken;
  }

  const settings = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
  const payment = existing.payments[0];
  const address = existing.postalAddress || formatPostalAddress(existing.applicant);
  const courseName = existing.enrolledCourseName || existing.course.name;
  const studentName = existing.studentName || existing.applicant.fullName;
  const guardianName =
    existing.guardianName || existing.applicant.guardianName || existing.applicant.fatherName || existing.applicant.motherName || "—";
  const studentMobile = existing.studentMobile || existing.applicant.mobile || "—";
  const batchOrClass = existing.batchOrClass || existing.course.batchInfo || "—";
  const paidAt = (payment?.paidAt || new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const token = existing.receiptToken || randomUUID();
  const receiptNumber = existing.receiptNumber || `RCP-${existing.applicationId}`;
  const filename = existing.receiptFilename || `${existing.applicationId}.html`;
  const photoSrc = await photoDataUri(existing.photoUrl);
  const html = buildReceiptHtml({
    instituteName: settings?.instituteName || "GP FOUNDATION, KONDAGAON",
    tagline: settings?.tagline || "",
    instituteAddress: settings?.address || "",
    phone: settings?.phone || "",
    email: settings?.email || "",
    enrollmentNumber: existing.applicationId,
    receiptNumber,
    studentName,
    studentMobile,
    guardianName,
    courseName,
    batchOrClass,
    examCentre: examCenterLabel(existing.examCenter),
    photoSrc,
    amountLabel: formatInrFromPaise(existing.feePaise),
    paidAt,
    paymentMode: paymentModeLabel(payment?.paymentMode),
    paymentStatus: "PAID / SUCCESS",
  });

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

  await prisma.courseRegistration.update({
    where: { id: existing.id },
    data: {
      postalAddress: address,
      enrolledCourseName: courseName,
      studentName,
      guardianName,
      studentMobile,
      batchOrClass,
      receiptNumber,
      receiptToken: token,
      receiptFilename: filename,
    },
  });

  return token;
}

export async function getReceiptForDownload(token: string) {
  const registration = await prisma.courseRegistration.findUnique({
    where: { receiptToken: token },
  });
  if (!registration?.receiptFilename) return null;

  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: "receipts", filename: registration.receiptFilename } },
  });
  if (!file) {
    const rebuilt = await finalizePaidRegistration(registration.id);
    if (!rebuilt) return null;
    const again = await prisma.courseRegistration.findUnique({ where: { id: registration.id } });
    if (!again?.receiptFilename) return null;
    const rebuiltFile = await prisma.mediaFile.findUnique({
      where: { folder_filename: { folder: "receipts", filename: again.receiptFilename } },
    });
    if (!rebuiltFile) return null;
    await prisma.courseRegistration.update({
      where: { id: registration.id },
      data: { receiptDownloadedAt: new Date() },
    });
    return {
      bytes: Buffer.from(rebuiltFile.data),
      mimeType: rebuiltFile.mimeType,
      downloadName: `GP-Foundation-Receipt-${registration.applicationId}.html`,
    };
  }

  await prisma.courseRegistration.update({
    where: { id: registration.id },
    data: { receiptDownloadedAt: new Date() },
  });

  return {
    bytes: Buffer.from(file.data),
    mimeType: file.mimeType,
    downloadName: `GP-Foundation-Receipt-${registration.applicationId}.html`,
  };
}
