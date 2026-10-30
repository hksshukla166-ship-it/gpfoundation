import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReceiptForDownload } from "@/lib/receipt";
import { ensureReceiptForApplication } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }
  const format = request.nextUrl.searchParams.get("format") === "html" ? "html" : "pdf";

  let receipt = await getReceiptForDownload(token, format);
  if (!receipt) {
    const registration = await prisma.courseRegistration.findUnique({ where: { receiptToken: token } });
    if (registration) {
      await ensureReceiptForApplication(registration.applicationId).catch(() => null);
      receipt = await getReceiptForDownload(token, format);
    }
  }
  if (!receipt) {
    return NextResponse.json({ error: "Receipt is not ready yet." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(receipt.bytes), {
    headers: {
      "Content-Type": receipt.mimeType,
      "Content-Disposition": `${format === "html" ? "inline" : "attachment"}; filename="${receipt.downloadName}"`,
      "Cache-Control": "no-store",
    },
  });
}
