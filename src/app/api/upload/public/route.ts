import { NextRequest, NextResponse } from "next/server";
import { asUploadFile, saveUpload } from "@/lib/upload";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`upload-public:${ip}`, 12).ok) {
    return NextResponse.json({ error: "Too many uploads." }, { status: 429 });
  }
  const form = await request.formData();
  const file = asUploadFile(form.get("file"));
  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  const kind = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const isImage = kind.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|bmp)$/.test(name);
  if (!isImage) {
    return NextResponse.json({ error: "Only images are allowed." }, { status: 400 });
  }
  try {
    const url = await saveUpload(file, "applicants");
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
