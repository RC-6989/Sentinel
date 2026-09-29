import { ToolInputError } from "./tool-schema";
import { isIP } from "node:net";

/** An operator-controlled exact-origin allowlist bounds tenant-configured URLs. */
export function parseToolTarget(raw: string, requireAllowed = true): URL {
  if (!raw || Buffer.byteLength(raw, "utf8") > 2048) throw new ToolInputError("Target URL must be 1–2048 bytes.");
  let target: URL;
  try { target = new URL(raw); }
  catch { throw new ToolInputError("Enter a valid absolute target URL."); }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  const ipHost = target.hostname.startsWith("[") ? target.hostname.slice(1, -1) : target.hostname;
  if (isIP(ipHost) && !loopback) {
    throw new ToolInputError("IP-address targets are not supported. Use an allowlisted HTTPS hostname.");
  }
  const allowedHttp = loopback && process.env.SENTINEL_ALLOW_INSECURE_LOOPBACK_TOOLS === "true";
  if (target.protocol !== "https:" && !(target.protocol === "http:" && allowedHttp)) {
    throw new ToolInputError("Targets must use HTTPS. Local HTTP loopback requires explicit server configuration.");
  }
  if (target.username || target.password || target.search || target.hash) {
    throw new ToolInputError("Target URLs cannot contain credentials, a query, or a fragment.");
  }
  if (requireAllowed) {
    const origins = (process.env.SENTINEL_ALLOWED_TOOL_ORIGINS ?? "").split(",").map(value => value.trim());
    if (!origins.includes(target.origin)) throw new ToolInputError("Target origin is not on the server allowlist.");
  }
  return target;
}
