import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  const orderId = event.payload?.payment?.entity?.order_id;
  const paymentId = event.payload?.payment?.entity?.id;
  if (!orderId) return NextResponse.json({ ok: true });

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
  if (!payment) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS", razorpayPaymentId: paymentId, paidAt: payment.paidAt ?? new Date() },
      }),
      prisma.courseRegistration.update({
        where: { id: payment.registrationId },
        data: { status: "PAYMENT_SUCCESSFUL" },
      }),
    ]);
  }
  if (event.event === "payment.failed") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", razorpayPaymentId: paymentId } }),
      prisma.courseRegistration.update({ where: { id: payment.registrationId }, data: { status: "PAYMENT_FAILED" } }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
