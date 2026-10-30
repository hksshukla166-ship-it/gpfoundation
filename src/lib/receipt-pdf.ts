import { createRequire } from "module";
import { existsSync, readFileSync } from "fs";
import path from "path";
import type { ReceiptView } from "@/lib/receipt-types";

const require = createRequire(import.meta.url);

function fontPath() {
  const candidates = [
    path.join(process.cwd(), "src", "fonts", "NotoSansDevanagari-Regular.ttf"),
    path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"),
  ];
  return candidates.find((item) => existsSync(item)) || null;
}

export async function buildReceiptPdf(view: ReceiptView): Promise<Buffer> {
  const PDFDocument = require("pdfkit") as typeof import("pdfkit");
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true, info: { Title: `GP Foundation Receipt ${view.receiptNumber}` } });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const hindiFont = fontPath();
  if (hindiFont) {
    doc.registerFont("NotoSansDev", hindiFont);
    doc.font("NotoSansDev");
  }

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).strokeColor("#c9a227").lineWidth(2).stroke();

  if (view.logoSrc.startsWith("data:")) {
    try {
      const raw = Buffer.from(view.logoSrc.split(",")[1] || "", "base64");
      doc.image(raw, 48, 40, { height: 36 });
    } catch {
      /* ignore invalid logo bytes */
    }
  }

  doc.fillColor("#071529").fontSize(16).text(view.instituteName, 48, 42, { width: pageWidth - 140 });
  doc.fontSize(9).fillColor("#5b6573").text(view.tagline, { width: pageWidth - 140 });
  if (view.instituteAddress) doc.text(view.instituteAddress, { width: pageWidth - 140 });
  doc.text([view.phone, view.email].filter(Boolean).join("  |  "));

  if (view.photoSrc.startsWith("data:")) {
    try {
      const raw = Buffer.from(view.photoSrc.split(",")[1] || "", "base64");
      doc.image(raw, doc.page.width - 150, 40, { width: 90, height: 108, fit: [90, 108] });
    } catch {
      /* ignore invalid photo bytes */
    }
  }
  if (view.signatureSrc.startsWith("data:")) {
    try {
      const raw = Buffer.from(view.signatureSrc.split(",")[1] || "", "base64");
      doc.image(raw, doc.page.width - 150, 154, { width: 90, height: 36, fit: [90, 36] });
    } catch {
      /* ignore invalid signature bytes */
    }
  }

  doc.moveDown(1.4);
  doc.fillColor("#c9a227").rect(48, doc.y, pageWidth, 3).fill();
  doc.moveDown(1);
  doc.fillColor("#071529").fontSize(13).text("PAYMENT RECEIPT / शुल्क रसीद");
  doc.moveDown(0.4);
  doc.fontSize(11).text(`Enrollment / Student ID: ${view.enrollmentNumber}`);
  doc.text(`Receipt Number: ${view.receiptNumber}`);
  doc.fillColor("#1b7a3d").text(view.paymentStatus);
  doc.fillColor("#071529");

  const rows: Array<[string, string]> = [
    ["विद्यार्थी का पूरा नाम", view.studentName],
    ["विद्यार्थी का मोबाइल नंबर", view.studentMobile],
    ["पिता का नाम", view.fatherName],
    ["किस कोर्स में है", view.courseName],
    ["Course Type", view.courseType],
    ["Examination Group", view.examinationGroup],
    ["Selected Examination", view.selectedExamination],
    ["Hostel Facility", view.hostelFacility],
    ["कौन-सा बैच/कक्षा", view.batchOrClass],
    ["परीक्षा केंद्र", view.examCentre],
    ["Enrollment / Registration Number", view.enrollmentNumber],
    ["विद्यार्थी के हस्ताक्षर", view.signatureSrc ? "Attached" : "—"],
  ];

  doc.moveDown(0.8);
  doc.fontSize(12).text("Student Details / विद्यार्थी विवरण");
  doc.moveDown(0.3);
  doc.fontSize(10);
  for (const [label, value] of rows) {
    const y = doc.y;
    doc.fillColor("#5b6573").text(label, 48, y, { width: 240, continued: false });
    doc.fillColor("#071529").text(value, 300, y, { width: pageWidth - 260 });
    doc.moveDown(0.15);
  }

  doc.moveDown(0.6);
  doc.fontSize(12).fillColor("#071529").text("Fee Details / शुल्क विवरण");
  doc.moveDown(0.3);
  const tableTop = doc.y;
  const colLabel = 48;
  const colAmount = 330;
  const rowH = 22;
  const fees: Array<[string, string]> = [
    ["Description", "Amount"],
    ["Course Registration Fee", view.courseFeeLabel],
    ["Hostel Registration Fee", view.hostelFeeLabel],
    ["Total Amount Paid", view.amountLabel],
  ];
  fees.forEach((row, index) => {
    const y = tableTop + index * rowH;
    doc.rect(colLabel, y, pageWidth, rowH).strokeColor("#d9d2c3").lineWidth(0.6).stroke();
    doc.fillColor("#071529").fontSize(10).text(row[0], colLabel + 8, y + 6, { width: 260 });
    doc.text(row[1], colAmount, y + 6, { width: 180, align: "right" });
  });
  doc.y = tableTop + fees.length * rowH + 8;

  if (hindiFont) doc.font("NotoSansDev");
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor("#071529").text("Payment Details / भुगतान विवरण");
  doc.moveDown(0.3);
  doc.fontSize(10);
  const payments: Array<[string, string]> = [
    ["भुगतान की तारीख और समय", view.paidAt],
    ["Payment Status", view.paymentStatus],
    ["Payment Mode", view.paymentMode],
    ["Receipt Number", view.receiptNumber],
    ["Transaction / Order ID", view.transactionId],
    ["Payment ID", view.paymentId],
  ];
  for (const [label, value] of payments) {
    const y = doc.y;
    doc.fillColor("#5b6573").text(label, 48, y, { width: 240 });
    doc.fillColor("#071529").text(value, 300, y, { width: pageWidth - 260 });
    doc.moveDown(0.15);
  }

  doc.moveDown(0.8);
  doc.fontSize(10);
  const noticeWidth = pageWidth - 16;
  const noticeHeight = Math.max(72, doc.heightOfString(view.refundNotice, { width: noticeWidth }) + 20);
  if (doc.y + noticeHeight > doc.page.height - doc.page.margins.bottom - 24) {
    doc.addPage();
    doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).strokeColor("#c9a227").lineWidth(2).stroke();
    if (hindiFont) doc.font("NotoSansDev");
  }
  const noticeTop = doc.y;
  doc.save();
  doc.rect(48, noticeTop, pageWidth, noticeHeight).fillAndStroke("#fff8e8", "#c9a227");
  doc.restore();
  doc.fillColor("#071529").fontSize(10).text(view.refundNotice, 56, noticeTop + 10, {
    width: noticeWidth,
    align: "left",
  });

  doc.end();
  return done;
}
