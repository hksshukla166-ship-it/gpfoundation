import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 4 * 1024 * 1024;
export const PRIVATE_UPLOAD_FOLDERS = new Set(["applicants", "signatures", "receipts"]);
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  bmp: "image/bmp",
  mp4: "video/mp4",
  webm: "video/webm",
};

export type UploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function asUploadFile(value: unknown): UploadFile | null {
  if (!value || typeof value !== "object") return null;
  const file = value as UploadFile;
  if (typeof file.arrayBuffer !== "function" || typeof file.size !== "number") return null;
  if (file.size <= 0) return null;
  return file;
}

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function contentTypeForExt(ext: string) {
  return MIME_BY_EXT[ext.toLowerCase()] || "application/octet-stream";
}

export function resolveUploadKind(file: UploadFile, imageOnly = false) {
  const fromName = extensionFromName(file.name || "");
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();
  if (fromName === "heic" || fromName === "heif" || mime === "image/heic" || mime === "image/heif") {
    throw new Error("HEIC photos are not supported. Please upload a JPG, PNG, or WebP image.");
  }
  const ext = EXT_BY_MIME[mime] || (MIME_BY_EXT[fromName] ? (fromName === "jpeg" ? "jpg" : fromName) : "");
  if (!ext) {
    throw new Error("Unsupported file type. Use JPG, PNG, or WebP.");
  }
  if (imageOnly && !IMAGE_EXTS.has(ext)) {
    throw new Error("Please upload a JPG, PNG, or WebP image under 4 MB.");
  }
  return { ext, mime: MIME_BY_EXT[ext] || mime };
}

export function parseUploadKey(segments: string[]) {
  if (segments.length !== 2) return null;
  const [folder, filename] = segments;
  if (!folder || !filename) return null;
  if (!/^[\w-]+$/.test(folder)) return null;
  if (!/^[\w.-]+$/.test(filename)) return null;
  return { folder, filename };
}

function assertImageMagicBytes(data: Buffer) {
  const jpeg = data.length > 3 && data[0] === 0xff && data[1] === 0xd8;
  const png = data.length > 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
  const webp =
    data.length > 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
  if (!jpeg && !png && !webp) {
    throw new Error("Please upload a valid JPG, PNG, or WebP image under 4 MB.");
  }
}

export async function saveUpload(file: UploadFile, folder: string, options?: { imageOnly?: boolean }) {
  if (file.size > MAX_BYTES) {
    throw new Error("File is too large. Please upload a JPG, PNG, or WebP image under 4 MB.");
  }
  const { ext, mime } = resolveUploadKind(file, options?.imageOnly);
  const safeFolder = folder.replace(/[^\w-]/g, "") || "general";
  const filename = `${randomUUID()}.${ext}`;
  const data = Buffer.from(await file.arrayBuffer());
  if (options?.imageOnly) assertImageMagicBytes(data);
  await prisma.mediaFile.create({
    data: {
      folder: safeFolder,
      filename,
      mimeType: mime,
      data,
    },
  });
  return `/uploads/${safeFolder}/${filename}`;
}
