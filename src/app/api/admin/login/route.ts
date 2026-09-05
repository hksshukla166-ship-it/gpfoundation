import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, signAdminToken, verifyAdminCredentials } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`login:${ip}`, 8, 5 * 60_000).ok) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const username = String(body?.username || "");
  const password = String(body?.password || "");

  try {
    const admin = await verifyAdminCredentials(username, password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    const token = await signAdminToken(admin);
    return attachSessionCookie(NextResponse.json({ ok: true }), token);
  } catch {
    return NextResponse.json({ error: "Database is not ready. Check Neon connection and try again." }, { status: 503 });
  }
}
