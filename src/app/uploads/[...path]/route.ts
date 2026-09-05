import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { contentTypeForExt, safeUploadPath } from "@/lib/upload";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filePath = safeUploadPath(segments);
  if (!filePath) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeForExt(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
