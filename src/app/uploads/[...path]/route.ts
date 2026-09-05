import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contentTypeForExt, parseUploadKey } from "@/lib/upload";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const key = parseUploadKey(segments);
  if (!key) return new NextResponse("Not found", { status: 404 });
  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: key.folder, filename: key.filename } },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });
  const ext = path.extname(file.filename).slice(1).toLowerCase();
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType || contentTypeForExt(ext),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
