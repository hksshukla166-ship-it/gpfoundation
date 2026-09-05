import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, jsonError } from "@/lib/api";
import { asUploadFile, saveUpload } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const form = await request.formData();
  const file = asUploadFile(form.get("file"));
  const folder = String(form.get("folder") || "general");
  if (!file) return jsonError("No file uploaded.");
  try {
    const url = await saveUpload(file, folder.replace(/[^\w-]/g, ""));
    return NextResponse.json({ url });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Upload failed");
  }
}
