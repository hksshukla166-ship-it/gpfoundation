import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enquirySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { isNeonConfigured } from "@/lib/settings";

export async function POST(request: NextRequest) {
  if (!isNeonConfigured()) {
    return NextResponse.json({ error: "Enquiry could not be saved. Database is not connected." }, { status: 503 });
  }
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`enquiry:${ip}`, 8).ok) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form fields." }, { status: 400 });
  }
  await prisma.enquiry.create({
    data: {
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      email: parsed.data.email || null,
      interestedProgram: parsed.data.interestedProgram || null,
      message: parsed.data.message,
    },
  });
  return NextResponse.json({ ok: true });
}
