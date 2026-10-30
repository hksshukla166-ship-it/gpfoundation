import { NextRequest, NextResponse } from "next/server";
import { asUploadFile, saveUpload } from "@/lib/upload";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const requested = String(form.get("kind") || "applicant").toLowerCase();
  const folder = requested === "signature" ? "signatures" : "applicants";
  const kind = (file.type || "").toLowerCase().split(";")[0].trim();
  const name = (file.name || "").toLowerCase();
  const allowedMime = kind === "image/jpeg" || kind === "image/jpg" || kind === "image/pjpeg" || kind === "image/png" || kind === "image/webp";
  const allowedName = /\.(jpe?g|png|webp)$/.test(name);
  if (!allowedMime && !allowedName) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, or WebP image under 4 MB." }, { status: 400 });
  }
  try {
    const url = await saveUpload(file, folder, { imageOnly: true });
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
