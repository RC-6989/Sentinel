import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

  let database: "ok" | "error" = "ok";
  try {
    getDb().prepare("SELECT 1 AS ok").get();
  } catch {
    database = "error";
  }

  const status = database === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      version,
      environment,
      checks: { database },
    },
    { status: database === "ok" ? 200 : 503 },
  );
}
