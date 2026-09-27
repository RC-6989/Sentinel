import { authenticateApiKey } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer (snt_[a-f0-9]{64})$/i.exec(authorization);
  const identity = match ? authenticateApiKey(match[1]) : null;
  const headers = { "Cache-Control": "no-store" };
  if (!identity) return Response.json({ error: "Invalid or inactive API key." }, { status: 401, headers: { ...headers, "WWW-Authenticate": "Bearer" } });
  return Response.json(identity, { headers });
}
