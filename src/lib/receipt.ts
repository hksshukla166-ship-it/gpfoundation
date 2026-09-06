import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, formatInrFromPaise } from "@/lib/fees";
import { additionalPreparationLabel, examCenterLabel } from "@/lib/catalog";

const REDACTED = "[REDACTED]";
const PLACEHOLDER_DOB = new Date("1970-01-01T00:00:00.000Z");

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

function buildReceiptHtml(args: {
  instituteName: string;
  tagline: string;
  instituteAddress: string;
  phone: string;
  email: string;
  applicationId: string;
  studentName: string;
  courseName: string;
  additional: string;
  caste: string;
  examCentre: string;
  address: string;
  amountLabel: string;
  paidAt: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GP Foundation Receipt — ${escapeHtml(args.applicationId)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; background: #f6f3ec; color: #071529; margin: 0; padding: 24px; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 3px solid #c9a227; padding: 32px 36px; }
    .brand { letter-spacing: 0.18em; font-weight: 700; font-size: 22px; }
    .gold { height: 4px; background: linear-gradient(90deg, #c9a227, #e6c35c); margin: 12px 0 18px; }
    h1 { font-size: 18px; margin: 0 0 8px; letter-spacing: 0.12em; }
    .muted { color: #5b6573; font-size: 13px; }
    .reg { font-size: 28px; font-weight: 700; letter-spacing: 0.08em; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #d9d2c3; vertical-align: top; }
    th { width: 40%; color: #5b6573; font-weight: 600; }
    .paid { margin-top: 20px; font-size: 20px; }
    .note { margin-top: 28px; font-size: 12px; color: #5b6573; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand">${escapeHtml(args.instituteName)}</div>
    <p class="muted">${escapeHtml(args.tagline)}</p>
    <div class="gold"></div>
    <h1>PAYMENT RECEIPT</h1>
    <p class="muted">${escapeHtml(args.instituteAddress)}<br/>${escapeHtml(args.phone)} · ${escapeHtml(args.email)}</p>
    <p>Registration Number</p>
    <p class="reg">${escapeHtml(args.applicationId)}</p>
    <table>
      <tr><th>Student name</th><td>${escapeHtml(args.studentName)}</td></tr>
      <tr><th>Enrolled course</th><td>${escapeHtml(args.courseName)}</td></tr>
      <tr><th>Additional classes</th><td>${escapeHtml(args.additional)}</td></tr>
      <tr><th>Caste / category</th><td>${escapeHtml(args.caste)}</td></tr>
      <tr><th>Examination centre</th><td>${escapeHtml(args.examCentre)}</td></tr>
      <tr><th>Address</th><td>${escapeHtml(args.address)}</td></tr>
      <tr><th>Payment date</th><td>${escapeHtml(args.paidAt)}</td></tr>
      <tr><th>Issued by</th><td>GP Foundation</td></tr>
    </table>
    <p class="paid">Amount paid: <strong>${escapeHtml(args.amountLabel)}</strong></p>
    <p class="note">This is an official fee receipt from GP Foundation. Download and keep a copy. After download this file is deleted from the institute website server. Quote your registration number for all future correspondence.</p>
  </div>
</body>
</html>`;
}

export async function finalizePaidRegistration(registrationId: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.courseRegistration.findUnique({
      where: { id: registrationId },
      include: {
        applicant: true,
        course: true,
        payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 },
      },
    });
    if (!registration) return null;
    if (registration.receiptToken) return registration.receiptToken;

    const settings = await tx.websiteSettings.findUnique({ where: { id: "default" } });
    const payment = registration.payments[0];
    const address =
      registration.postalAddress ||
      formatPostalAddress(registration.applicant);
    const courseName = registration.enrolledCourseName || registration.course.name;
    const studentName =
      registration.studentName && registration.studentName !== REDACTED
        ? registration.studentName
        : registration.applicant.fullName !== REDACTED
          ? registration.applicant.fullName
          : registration.studentName || registration.applicant.fullName;
    const caste = CATEGORY_LABELS[registration.category];
    const additional = registration.additionalPreparations.length
      ? registration.additionalPreparations.map((id) => additionalPreparationLabel(id)).join(", ")
      : "None";
    const paidAt = (payment?.paidAt || new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const token = randomUUID();
    const filename = `${registration.applicationId}.html`;
    const html = buildReceiptHtml({
      instituteName: settings?.instituteName || "GP FOUNDATION, KONDAGAON",
      tagline: settings?.tagline || "",
      instituteAddress: settings?.address || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      applicationId: registration.applicationId,
      studentName,
      courseName,
      additional,
      caste,
      examCentre: examCenterLabel(registration.examCenter),
      address,
      amountLabel: formatInrFromPaise(registration.feePaise),
      paidAt,
    });

    await tx.mediaFile.upsert({
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

    const photo = parseUploadsUrl(registration.photoUrl);
    const document = parseUploadsUrl(registration.documentUrl);
    if (photo) {
      await tx.mediaFile.deleteMany({ where: { folder: photo.folder, filename: photo.filename } });
    }
    if (document) {
      await tx.mediaFile.deleteMany({ where: { folder: document.folder, filename: document.filename } });
    }

    await tx.courseRegistration.update({
      where: { id: registration.id },
      data: {
        postalAddress: address,
        enrolledCourseName: courseName,
        studentName,
        receiptToken: token,
        receiptFilename: filename,
        photoUrl: null,
        documentUrl: null,
        piiClearedAt: new Date(),
      },
    });

    await tx.applicant.update({
      where: { id: registration.applicantId },
      data: {
        fullName: REDACTED,
        fatherName: REDACTED,
        motherName: REDACTED,
        mobile: "0000000000",
        email: null,
        dateOfBirth: PLACEHOLDER_DOB,
        qualification: REDACTED,
        schoolCollege: null,
        address,
        district: REDACTED,
        state: REDACTED,
      },
    });

    return token;
  });
}

export async function deleteReceiptFromServer(token: string) {
  const registration = await prisma.courseRegistration.findUnique({
    where: { receiptToken: token },
  });
  if (!registration?.receiptFilename) return null;

  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: "receipts", filename: registration.receiptFilename } },
  });
  if (!file) {
    await prisma.courseRegistration.update({
      where: { id: registration.id },
      data: { receiptToken: null, receiptFilename: null, receiptDownloadedAt: registration.receiptDownloadedAt ?? new Date() },
    });
    return null;
  }

  const payload = {
    bytes: Buffer.from(file.data),
    mimeType: file.mimeType,
    downloadName: `GP-Foundation-Receipt-${registration.applicationId}.html`,
  };

  await prisma.$transaction([
    prisma.mediaFile.delete({ where: { id: file.id } }),
    prisma.courseRegistration.update({
      where: { id: registration.id },
      data: {
        receiptToken: null,
        receiptFilename: null,
        receiptDownloadedAt: new Date(),
      },
    }),
  ]);

  return payload;
}
