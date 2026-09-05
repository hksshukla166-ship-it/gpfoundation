import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ADMIN = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || PUBLIC_ADMIN.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("gp_admin_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
