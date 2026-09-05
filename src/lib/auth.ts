import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "gp_admin_session";
const MAX_AGE = 60 * 60 * 8;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export type AdminSession = { sub: string; username: string };

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function signAdminToken(admin: { id: string; username: string }) {
  return new SignJWT({ username: admin.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE, token, cookieOptions());
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

export async function createSession(admin: { id: string; username: string }) {
  const token = await signAdminToken(admin);
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions());
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.username !== "string") return null;
    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  const admin = await prisma.admin.findUnique({ where: { id: session.sub } });
  return admin;
}

export async function ensureBootstrapAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!username || !passwordHash) return;
  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) return;
  await prisma.admin.create({
    data: { username, passwordHash, displayName: "Administrator" },
  });
}

export async function verifyAdminCredentials(username: string, password: string) {
  await ensureBootstrapAdmin();
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;
  return admin;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
