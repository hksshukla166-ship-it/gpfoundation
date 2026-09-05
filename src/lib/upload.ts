import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 15 * 1024 * 1024;

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

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

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

export function resolveUploadKind(file: UploadFile) {
  const fromName = extensionFromName(file.name || "");
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();
  if (fromName === "heic" || fromName === "heif" || mime === "image/heic" || mime === "image/heif") {
    throw new Error("HEIC photos are not supported. Please upload a JPG, PNG, or WebP image.");
  }
  const ext = EXT_BY_MIME[mime] || (MIME_BY_EXT[fromName] ? (fromName === "jpeg" ? "jpg" : fromName) : "");
  if (!ext) {
    throw new Error("Unsupported file type. Use JPG, PNG, WebP, GIF, or MP4.");
  }
  return { ext, mime: MIME_BY_EXT[ext] || mime };
}

export function safeUploadPath(segments: string[]) {
  if (!segments.length || segments.some((part) => !part || part === "." || part === ".." || /[\\/]/.test(part))) {
    return null;
  }
  const resolved = path.resolve(UPLOAD_ROOT, ...segments);
  const root = path.resolve(UPLOAD_ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export async function saveUpload(file: UploadFile, folder: string) {
  if (file.size > MAX_BYTES) {
    throw new Error("File is too large. Maximum size is 15 MB.");
  }
  const { ext } = resolveUploadKind(file);
  const safeFolder = folder.replace(/[^\w-]/g, "") || "general";
  const dir = path.join(UPLOAD_ROOT, safeFolder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${safeFolder}/${name}`;
}
