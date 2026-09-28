import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { finalizePaidRegistration } from "@/lib/receipt";

type RazorpayPaymentEntity = {
  id?: string;
  status?: string;
  method?: string;
  order_id?: string;
};

type RazorpayOrderEntity = {
  id?: string;
  status?: string;
};

function isCaptured(status?: string) {
  const normalized = status?.toLowerCase();
  return normalized === "captured" || normalized === "authorized";
}

function orderIsPaid(order: RazorpayOrderEntity | null | undefined) {
  return order?.status?.toLowerCase() === "paid";
}

async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrderEntity | null> {
  try {
    const razorpay = getRazorpay();
    return (await razorpay.orders.fetch(orderId)) as RazorpayOrderEntity;
  } catch {
    return null;
  }
}

function findCapturedPayment(items: RazorpayPaymentEntity[]) {
  return items.find((item) => isCaptured(item.status)) ?? null;
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

  let receiptToken: string | null = null;
  try {
    receiptToken = await finalizePaidRegistration(payment.registrationId);
  } catch {
    receiptToken = null;
  }
  const registration = await prisma.courseRegistration.findUnique({ where: { id: payment.registrationId } });
  return {
    applicationId: registration?.applicationId,
    receiptToken: receiptToken || registration?.receiptToken || null,
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

  const [order, items] = await Promise.all([fetchRazorpayOrder(orderId), fetchRazorpayPaymentsForOrder(orderId)]);
  const capturedOnOrder = findCapturedPayment(items);

  if (capturedOnOrder) {
    const result = await markOrderPaid({
      orderId,
      paymentId: capturedOnOrder.id || extras?.paymentId,
      signature: extras?.signature,
      paymentMode: capturedOnOrder.method,
    });
    return { ...result, paymentStatus: "SUCCESS" as const };
  }

  if (extras?.paymentId) {
    const direct = await fetchRazorpayPayment(extras.paymentId);
    if (direct && (!direct.order_id || direct.order_id === orderId) && isCaptured(direct.status)) {
      const result = await markOrderPaid({
        orderId,
        paymentId: direct.id || extras.paymentId,
        signature: extras?.signature,
        paymentMode: direct.method,
      });
      return { ...result, paymentStatus: "SUCCESS" as const };
    }
  }

  if (orderIsPaid(order)) {
    const fallback = extras?.paymentId || items.at(-1)?.id;
    const result = await markOrderPaid({
      orderId,
      paymentId: fallback,
      signature: extras?.signature,
      paymentMode: items.at(-1)?.method,
    });
    return { ...result, paymentStatus: "SUCCESS" as const };
  }

  const onlyFailedAttempts =
    items.length > 0 && items.every((item) => item.status?.toLowerCase() === "failed") && !orderIsPaid(order);

  if (onlyFailedAttempts) {
    const latestFailed = items.at(-1);
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: local.id },
        data: { status: "FAILED", razorpayPaymentId: latestFailed?.id || local.razorpayPaymentId },
      }),
      prisma.courseRegistration.update({ where: { id: local.registrationId }, data: { status: "PAYMENT_FAILED" } }),
    ]);
    const registration = await prisma.courseRegistration.findUnique({ where: { id: local.registrationId } });
    return { applicationId: registration?.applicationId, paymentStatus: "FAILED" as const, receiptToken: null };
  }

  const registration = await prisma.courseRegistration.findUnique({ where: { id: local.registrationId } });
  return {
    applicationId: registration?.applicationId,
    paymentStatus: "PENDING" as const,
    receiptToken: registration?.receiptToken || null,
  };
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
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const pending = await prisma.payment.findMany({
    where: {
      OR: [
        { status: { in: ["CREATED", "PENDING"] } },
        { status: "FAILED", createdAt: { gte: since } },
      ],
    },
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

/** Ensures receipt token exists when payment already succeeded (e.g. receipt step failed earlier). */
export async function ensureReceiptForApplication(applicationId: string) {
  const registration = await prisma.courseRegistration.findUnique({
    where: { applicationId },
    include: { payments: { where: { status: "SUCCESS" }, take: 1 } },
  });
  if (!registration) return null;
  const paid =
    registration.status === "PAYMENT_SUCCESSFUL" ||
    registration.payments.length > 0 ||
    registration.status === "VERIFIED" ||
    registration.status === "CONFIRMED";
  if (!paid) return null;
  if (registration.receiptToken) return registration.receiptToken;
  try {
    return await finalizePaidRegistration(registration.id);
  } catch {
    return null;
  }
}
