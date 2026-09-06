import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { finalizePaidRegistration } from "@/lib/receipt";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const orderId = body?.razorpay_order_id as string | undefined;
  const paymentId = body?.razorpay_payment_id as string | undefined;
  const signature = body?.razorpay_signature as string | undefined;
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }
  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
  if (!payment) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        status: "SUCCESS",
        paidAt: payment.paidAt ?? new Date(),
      },
    }),
    prisma.courseRegistration.update({
      where: { id: payment.registrationId },
      data: { status: "PAYMENT_SUCCESSFUL" },
    }),
  ]);

  try {
    await finalizePaidRegistration(payment.registrationId);
  } catch {
    // Receipt may already have been created by the Razorpay webhook.
  }
  const registration = await prisma.courseRegistration.findUnique({ where: { id: payment.registrationId } });
  return NextResponse.json({ applicationId: registration?.applicationId });
}
