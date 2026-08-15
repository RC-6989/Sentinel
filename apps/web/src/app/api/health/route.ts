import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.npm_package_version ??
    "0.1.0";

  const environment =
    process.env.SENTINEL_ENV ??
    process.env.NODE_ENV ??
    "development";

  return NextResponse.json({
    status: "ok",
    version,
    environment,
  });
}
