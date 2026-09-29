/**
 * Cloudflare Worker entry — deployment stub. The Phase 4 gateway currently
 * runs in the local Next.js Node/SQLite application.
 * Deployment requires Wrangler + Cloudflare account (manual user steps).
 */

export interface Env {
  // D1, KV, secrets bindings will be declared in wrangler.toml
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        version: "0.1.0",
        environment: "worker-stub",
      });
    }

    return Response.json(
      {
        error: "not_implemented",
        message: "Sentinel Worker gateway is not deployed. Use the local Next.js /v1/tools/{tool_id}/execute route for Phase 4 testing.",
      },
      { status: 501 },
    );
  },
};
