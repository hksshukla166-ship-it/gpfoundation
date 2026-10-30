import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { INTEGRATED_PROGRAM_LABEL } from "@/lib/catalog";
import { registrationSchema } from "@/lib/validation";
import { feePaiseForCategory, registrationFeeBreakdown, resolveFees } from "@/lib/fees";
import { nextApplicationId } from "@/lib/application-id";
import { getRazorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { isNeonConfigured } from "@/lib/settings";
import { formatPostalAddress } from "@/lib/receipt";
import { randomUUID } from "crypto";
async function assertStoredUpload(url: string, folder: string) {
  const match = url.match(/^\/uploads\/([\w-]+)\/([\w.-]+)$/);
  const parsed = match ? { folder: match[1], filename: match[2] } : null;
  if (!parsed || parsed.folder !== folder) return false;
  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: parsed.folder, filename: parsed.filename } },
    select: { id: true },
  });
  return Boolean(file);
}

export async function POST(request: NextRequest) {
  if (!isNeonConfigured()) {
    return NextResponse.json({ error: "Online registration is not available until the database is connected." }, { status: 503 });
  }
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`reg:${ip}`, 10).ok) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Please check the registration form.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const settings = await getSettings();
  if (!settings.admissionOpen) {
    return NextResponse.json({ error: "Admissions are closed." }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, isActive: true, archived: false, registrationOpen: true, categoryLabel: INTEGRATED_PROGRAM_LABEL },
  });
  if (!course) {
    return NextResponse.json({ error: "This course is not open for registration." }, { status: 400 });
  }

  const photoOk = await assertStoredUpload(parsed.data.photoUrl, "applicants");
  const signatureOk = await assertStoredUpload(parsed.data.signatureUrl, "signatures");
  if (!photoOk || !signatureOk) {
    return NextResponse.json({ error: "Please upload a valid photograph and signature." }, { status: 400 });
  }

  const courseFeePaise = feePaiseForCategory(parsed.data.category, resolveFees(settings, course));
  const { hostelFeePaise, totalPaise } = registrationFeeBreakdown(courseFeePaise, parsed.data.hostelRequired);
  const applicationId = await nextApplicationId();
  const dobParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parsed.data.dateOfBirth);
  const dob = dobParts
    ? new Date(Date.UTC(Number(dobParts[1]), Number(dobParts[2]) - 1, Number(dobParts[3])))
    : new Date(parsed.data.dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json({ error: "Please enter a valid date of birth." }, { status: 400 });
  }

  let order: { id: string };
  try {
    const razorpay = getRazorpay();
    order = await razorpay.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: applicationId,
      notes: {
        applicationId,
        courseId: course.id,
        category: parsed.data.category,
        examCenter: parsed.data.examCenter,
        courseType: parsed.data.courseType,
        examinationGroup: parsed.data.examinationGroup,
        selectedExamination: parsed.data.selectedExamination,
        hostelRequired: parsed.data.hostelRequired ? "yes" : "no",
      },
    });
  } catch {
    return NextResponse.json({ error: "Online payment is not available right now. Please contact the institute." }, { status: 503 });
  }

  const completeAddress = formatPostalAddress({
    village: parsed.data.village,
    postOffice: parsed.data.postOffice,
    tehsil: parsed.data.tehsil,
    address: parsed.data.address || "",
    district: parsed.data.district,
    state: parsed.data.state,
  });
  const guardianName = parsed.data.guardianName || parsed.data.fatherName;
  const rationNumber = parsed.data.rationCardHolder ? parsed.data.rationCardNumber || null : null;

  const receiptToken = randomUUID();
  await prisma.$transaction(async (tx) => {
    const applicant = await tx.applicant.create({
      data: {
        fullName: parsed.data.fullName,
        fatherName: parsed.data.fatherName,
        motherName: parsed.data.motherName,
        guardianName,
        mobile: parsed.data.mobile,
        email: parsed.data.email || null,
        dateOfBirth: dob,
        gender: parsed.data.gender ?? "OTHER",
        address: completeAddress,
        district: parsed.data.district,
        state: parsed.data.state,
        qualification: parsed.data.qualification || "",
        schoolCollege: parsed.data.schoolCollege || null,
        educationMedium: parsed.data.educationMedium,
        class10Percentage: parsed.data.class10Percentage,
        rationCardHolder: parsed.data.rationCardHolder,
        rationCardNumber: rationNumber,
        aadhaarNumber: parsed.data.aadhaarNumber || null,
        village: parsed.data.village,
        postOffice: parsed.data.postOffice,
        tehsil: parsed.data.tehsil,
      },
    });

    const registration = await tx.courseRegistration.create({
      data: {
        applicationId,
        applicantId: applicant.id,
        courseId: course.id,
        category: parsed.data.category,
        examCenter: parsed.data.examCenter,
        feePaise: totalPaise,
        status: "PAYMENT_INITIATED",
        postalAddress: completeAddress,
        enrolledCourseName: course.name,
        studentName: parsed.data.fullName,
        guardianName,
        fatherName: parsed.data.fatherName,
        motherName: parsed.data.motherName,
        batchOrClass: parsed.data.batchOrClass,
        studentMobile: parsed.data.mobile,
        photoUrl: parsed.data.photoUrl,
        signatureUrl: parsed.data.signatureUrl,
        documentUrl: parsed.data.documentUrl || null,
        additionalPreparations: parsed.data.additionalPreparations,
        courseType: parsed.data.courseType,
        examinationGroup: parsed.data.examinationGroup,
        selectedExamination: parsed.data.selectedExamination,
        hostelRequired: parsed.data.hostelRequired,
        courseFeePaise,
        hostelFeePaise,
        receiptToken,
      },
    });

    await tx.payment.create({
      data: {
        registrationId: registration.id,
        applicantId: applicant.id,
        courseId: course.id,
        category: parsed.data.category,
        amountPaise: totalPaise,
        courseFeePaise,
        hostelFeePaise,
        razorpayOrderId: order.id,
        status: "PENDING",
      },
    });
  });

  return NextResponse.json({
    orderId: order.id,
    amount: totalPaise,
    applicationId,
    receiptToken,
    courseFeePaise,
    hostelFeePaise,
    totalPaise,
  });
}
