import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { INTEGRATED_PROGRAM_LABEL } from "@/lib/catalog";
import { registrationSchema } from "@/lib/validation";
import { feePaiseForCategory, resolveFees } from "@/lib/fees";
import { nextApplicationId } from "@/lib/application-id";
import { getRazorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { isNeonConfigured } from "@/lib/settings";
import { formatPostalAddress } from "@/lib/receipt";

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
    return NextResponse.json({ error: "Please check the registration form." }, { status: 400 });
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

  const amount = feePaiseForCategory(parsed.data.category, resolveFees(settings, course));
  const applicationId = await nextApplicationId();
  const dobRaw = parsed.data.dateOfBirth;
  const dob = dobRaw ? new Date(dobRaw) : new Date("2000-01-01T00:00:00.000Z");
  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
  }

  let order: { id: string };
  try {
    const razorpay = getRazorpay();
    order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: applicationId,
      notes: { applicationId, courseId: course.id, category: parsed.data.category, examCenter: parsed.data.examCenter },
    });
  } catch {
    return NextResponse.json({ error: "Online payment is not available right now. Please contact the institute." }, { status: 503 });
  }

  const guardianName = parsed.data.guardianName;
  const applicant = await prisma.applicant.create({
    data: {
      fullName: parsed.data.fullName,
      fatherName: parsed.data.fatherName || guardianName,
      motherName: parsed.data.motherName || guardianName,
      guardianName,
      mobile: parsed.data.mobile,
      email: parsed.data.email || null,
      dateOfBirth: dob,
      gender: parsed.data.gender ?? "OTHER",
      address: parsed.data.address || "",
      district: parsed.data.district || "",
      state: parsed.data.state || "",
      qualification: parsed.data.qualification || "",
      schoolCollege: parsed.data.schoolCollege || null,
    },
  });

  const registration = await prisma.courseRegistration.create({
    data: {
      applicationId,
      applicantId: applicant.id,
      courseId: course.id,
      category: parsed.data.category,
      examCenter: parsed.data.examCenter,
      feePaise: amount,
      status: "PAYMENT_INITIATED",
      postalAddress: formatPostalAddress({
        address: parsed.data.address || "",
        district: parsed.data.district || "",
        state: parsed.data.state || "",
      }),
      enrolledCourseName: course.name,
      studentName: parsed.data.fullName,
      guardianName,
      batchOrClass: parsed.data.batchOrClass,
      studentMobile: parsed.data.mobile,
      photoUrl: parsed.data.photoUrl,
      documentUrl: parsed.data.documentUrl || null,
      additionalPreparations: parsed.data.additionalPreparations,
    },
  });

  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      applicantId: applicant.id,
      courseId: course.id,
      category: parsed.data.category,
      amountPaise: amount,
      razorpayOrderId: order.id,
      status: "PENDING",
    },
  });

  return NextResponse.json({ orderId: order.id, amount, applicationId });
}
