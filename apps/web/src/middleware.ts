import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED = [/^\/app(?:\/|$)/, /^\/login(?:\/|$)/, /^\/signup(?:\/|$)/];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const waitlistMode = process.env.SENTINEL_WAITLIST_MODE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.SENTINEL_WAITLIST_MODE !== "false");
  if (waitlistMode && BLOCKED.some((re) => re.test(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
