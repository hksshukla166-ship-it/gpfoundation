import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid, reconcileOrder } from "@/lib/payments";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; method?: string; status?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
  const paymentId = event.payload?.payment?.entity?.id;
  const paymentMode = event.payload?.payment?.entity?.method;
  if (!orderId) return NextResponse.json({ ok: true });

  const name = event.event || "";
  if (name === "payment.captured" || name === "payment.authorized" || name === "order.paid") {
    try {
      await markOrderPaid({ orderId, paymentId, paymentMode });
    } catch {
      await reconcileOrder(orderId, { paymentId });
    }
  }
  if (name === "payment.failed") {
    await reconcileOrder(orderId, { paymentId });
  }

  return NextResponse.json({ ok: true });
}
