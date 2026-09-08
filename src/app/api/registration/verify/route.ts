import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { markOrderPaid, reconcileOrder } from "@/lib/payments";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const orderId = body?.razorpay_order_id as string | undefined;
  const paymentId = body?.razorpay_payment_id as string | undefined;
  const signature = body?.razorpay_signature as string | undefined;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  try {
    if (signature && verifyRazorpaySignature(orderId, paymentId, signature)) {
      const paid = await markOrderPaid({ orderId, paymentId, signature });
      if (!paid) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      return NextResponse.json({
        applicationId: paid.applicationId,
        receiptToken: paid.receiptToken,
        paymentStatus: "SUCCESS",
      });
    }

    const reconciled = await reconcileOrder(orderId, { paymentId, signature });
    if (!reconciled) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (reconciled.paymentStatus !== "SUCCESS") {
      return NextResponse.json({ error: "Payment is still pending. Please wait a moment." }, { status: 409 });
    }
    return NextResponse.json({
      applicationId: reconciled.applicationId,
      receiptToken: reconciled.receiptToken,
      paymentStatus: "SUCCESS",
    });
  } catch {
    return NextResponse.json({ error: "Payment was received but receipt generation failed. Please open the success page." }, { status: 500 });
  }
}
