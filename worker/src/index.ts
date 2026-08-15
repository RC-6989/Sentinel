/**
 * Cloudflare Worker entry — stub for Phase 4 gateway.
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
        message: "Sentinel Worker gateway is not implemented yet (Phase 4).",
      },
      { status: 501 },
    );
  },
};
