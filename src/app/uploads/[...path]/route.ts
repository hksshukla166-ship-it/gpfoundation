import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contentTypeForExt, parseUploadKey, PRIVATE_UPLOAD_FOLDERS } from "@/lib/upload";
import { getSession } from "@/lib/auth";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const key = parseUploadKey(segments);
  if (!key) return new NextResponse("Not found", { status: 404 });
  if (PRIVATE_UPLOAD_FOLDERS.has(key.folder)) {
    const session = await getSession();
    if (!session) return new NextResponse("Not found", { status: 404 });
  }
  const file = await prisma.mediaFile.findUnique({
    where: { folder_filename: { folder: key.folder, filename: key.filename } },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });
  const ext = path.extname(file.filename).slice(1).toLowerCase();
  const privateFile = PRIVATE_UPLOAD_FOLDERS.has(key.folder);
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType || contentTypeForExt(ext),
      "Cache-Control": privateFile ? "private, no-store" : "public, max-age=31536000, immutable",
    },
  });
}
