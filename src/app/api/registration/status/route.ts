import { NextRequest, NextResponse } from "next/server";
import { ensureReceiptForApplication, reconcileRegistrationByApplicationId } from "@/lib/payments";
import { paymentStatusLabel } from "@/lib/payment-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const applicationId = request.nextUrl.searchParams.get("applicationId")?.trim();
  if (!applicationId) {
    return NextResponse.json({ error: "Missing application id." }, { status: 400 });
  }
  const result = await reconcileRegistrationByApplicationId(applicationId);
  if (!result) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  let receiptToken = result.receiptToken || null;
  if (result.paymentStatus === "SUCCESS" && !receiptToken) {
    receiptToken = (await ensureReceiptForApplication(applicationId)) || null;
  }
  return NextResponse.json({
    applicationId: result.applicationId,
    paymentStatus: result.paymentStatus,
    paymentStatusLabel: paymentStatusLabel(result.paymentStatus),
    receiptToken,
  });
}
