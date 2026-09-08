import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { finalizePaidRegistration } from "@/lib/receipt";

type RazorpayPaymentEntity = {
  id?: string;
  status?: string;
  method?: string;
  order_id?: string;
};

function isCaptured(status?: string) {
  return status === "captured" || status === "authorized";
}

export async function fetchRazorpayPaymentsForOrder(orderId: string): Promise<RazorpayPaymentEntity[]> {
  try {
    const razorpay = getRazorpay();
    const result = (await razorpay.orders.fetchPayments(orderId)) as { items?: RazorpayPaymentEntity[] };
    return result.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentEntity | null> {
  try {
    const razorpay = getRazorpay();
    return (await razorpay.payments.fetch(paymentId)) as RazorpayPaymentEntity;
  } catch {
    return null;
  }
}

export async function markOrderPaid(args: {
  orderId: string;
  paymentId?: string;
  signature?: string;
  paymentMode?: string;
}) {
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: args.orderId } });
  if (!payment) return null;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId: args.paymentId || payment.razorpayPaymentId,
        razorpaySignature: args.signature || payment.razorpaySignature,
        paymentMode: args.paymentMode || payment.paymentMode,
        paidAt: payment.paidAt ?? new Date(),
      },
    }),
    prisma.courseRegistration.update({
      where: { id: payment.registrationId },
      data: { status: "PAYMENT_SUCCESSFUL" },
    }),
  ]);

  const receiptToken = await finalizePaidRegistration(payment.registrationId);
  const registration = await prisma.courseRegistration.findUnique({ where: { id: payment.registrationId } });
  return {
    applicationId: registration?.applicationId,
    receiptToken,
    receiptNumber: registration?.receiptNumber,
  };
}

export async function reconcileOrder(orderId: string, extras?: { paymentId?: string; signature?: string }) {
  const local = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
  if (!local) return null;
  if (local.status === "SUCCESS") {
    const receiptToken = await finalizePaidRegistration(local.registrationId);
    const registration = await prisma.courseRegistration.findUnique({ where: { id: local.registrationId } });
    return {
      applicationId: registration?.applicationId,
      receiptToken,
      receiptNumber: registration?.receiptNumber,
      paymentStatus: "SUCCESS" as const,
    };
  }

  let remote: RazorpayPaymentEntity | null = extras?.paymentId ? await fetchRazorpayPayment(extras.paymentId) : null;
  if (remote && remote.order_id && remote.order_id !== orderId) {
    remote = null;
  }
  if (!remote || !isCaptured(remote.status)) {
    const items = await fetchRazorpayPaymentsForOrder(orderId);
    remote = items.find((item) => isCaptured(item.status)) || items[0] || null;
  }

  if (remote && isCaptured(remote.status)) {
    const result = await markOrderPaid({
      orderId,
      paymentId: remote.id || extras?.paymentId,
      signature: extras?.signature,
      paymentMode: remote.method,
    });
    return { ...result, paymentStatus: "SUCCESS" as const };
  }

  if (remote?.status === "failed") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: local.id }, data: { status: "FAILED", razorpayPaymentId: remote.id } }),
      prisma.courseRegistration.update({ where: { id: local.registrationId }, data: { status: "PAYMENT_FAILED" } }),
    ]);
    const registration = await prisma.courseRegistration.findUnique({ where: { id: local.registrationId } });
    return { applicationId: registration?.applicationId, paymentStatus: "FAILED" as const, receiptToken: null };
  }

  const registration = await prisma.courseRegistration.findUnique({ where: { id: local.registrationId } });
  return { applicationId: registration?.applicationId, paymentStatus: "PENDING" as const, receiptToken: null };
}

export async function reconcileRegistrationByApplicationId(applicationId: string) {
  const registration = await prisma.courseRegistration.findUnique({
    where: { applicationId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!registration) return null;
  const payment = registration.payments[0];
  if (!payment) {
    return {
      applicationId,
      paymentStatus: "PENDING" as const,
      receiptToken: registration.receiptToken,
      receiptNumber: registration.receiptNumber,
    };
  }
  const result = await reconcileOrder(payment.razorpayOrderId);
  return result;
}

export async function syncPendingPayments(limit = 40) {
  const pending = await prisma.payment.findMany({
    where: { status: { in: ["CREATED", "PENDING"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  let updated = 0;
  for (const payment of pending) {
    const result = await reconcileOrder(payment.razorpayOrderId);
    if (result?.paymentStatus === "SUCCESS") updated += 1;
  }
  return updated;
}
