import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const orderId = body?.razorpay_order_id as string | undefined;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
  if (!payment) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (payment.status === "SUCCESS") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PENDING" },
  });
  await prisma.courseRegistration.update({
    where: { id: payment.registrationId },
    data: { status: "PAYMENT_INITIATED" },
  });

  return NextResponse.json({ ok: true });
}
