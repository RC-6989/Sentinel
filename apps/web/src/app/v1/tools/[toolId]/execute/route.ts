import { executeToolCall, GatewayError } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

async function readBody(request: Request) {
  const length = Number(request.headers.get("content-length"));
  if (length > 64 * 1024) throw new GatewayError(413, "request_too_large", "Request body must be at most 64 KiB.");
  const reader = request.body?.getReader();
  if (!reader) throw new GatewayError(400, "invalid_input", "A JSON object body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 64 * 1024) {
      await reader.cancel();
      throw new GatewayError(413, "request_too_large", "Request body must be at most 64 KiB.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, size).toString("utf8");
}

export async function POST(request: Request, { params }: { params: Promise<{ toolId: string }> }) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const match = /^Bearer (snt_[a-f0-9]{64})$/i.exec(authorization);
    if (!match) throw new GatewayError(401, "unauthorized", "Invalid or inactive API key.");
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw new GatewayError(415, "unsupported_media_type", "Send application/json.");
    }
    const requestId = request.headers.get("idempotency-key") ?? "";
    const { toolId } = await params;
    const result = await executeToolCall(match[1].toLowerCase(), toolId, requestId, await readBody(request));
    return Response.json(result, { headers });
  } catch (error) {
    if (error instanceof GatewayError) {
      return Response.json({ error: error.code, message: error.message }, {
        status: error.status,
        headers: { ...headers, ...(error.status === 401 ? { "WWW-Authenticate": "Bearer" } : {}) },
      });
    }
    return Response.json({ error: "internal_error", message: "Tool execution failed." }, { status: 500, headers });
  }
}
