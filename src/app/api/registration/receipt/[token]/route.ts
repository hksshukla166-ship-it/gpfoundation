import { NextResponse } from "next/server";
import { getReceiptForDownload } from "@/lib/receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }

  const receipt = await getReceiptForDownload(token);
  if (!receipt) {
    return NextResponse.json({ error: "Receipt is not ready yet." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(receipt.bytes), {
    headers: {
      "Content-Type": receipt.mimeType,
      "Content-Disposition": `attachment; filename="${receipt.downloadName}"`,
      "Cache-Control": "no-store",
    },
  });
}
