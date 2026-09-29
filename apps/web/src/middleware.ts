import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dashboardEnabled } from "@/lib/deployment";

const BLOCKED = [/^\/app(?:\/|$)/, /^\/login(?:\/|$)/, /^\/signup(?:\/|$)/];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!dashboardEnabled() && BLOCKED.some((re) => re.test(pathname))) {
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
