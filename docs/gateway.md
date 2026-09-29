# Local execution gateway (Phases 4–5)

The Node/SQLite app exposes `POST /v1/tools/{tool_id}/execute`. It sends validated JSON to a configured HTTP target only when an active project policy allows the call. The Cloudflare Worker gateway is still a stub; this route requires a persistent Node/SQLite host. Execution is **off by default** for every tool, and no matching allow policy means deny. Only low or medium risk definitions can be enabled. Risk levels are classifications set by the organization, not automatic safety assessments.

## Configure a tool

The server operator sets an exact-origin allowlist in `apps/web/.env.local` and restarts the app:

```sh
SENTINEL_ALLOWED_TOOL_ORIGINS=https://api.example.com
```

The default empty value denies all outbound execution. The target URL must be an absolute HTTPS URL at one of the listed origins. Credentials, query strings, and fragments are rejected. The operator can pause all gateway execution by setting `SENTINEL_GLOBAL_KILL_SWITCH=true` and restarting.

Direct IP-address targets are rejected except the explicitly enabled loopback test hosts below. The exact-origin check does not pin DNS answers: operators should allow only domains they trust, monitor their resolution, and apply outbound network controls on any host that can reach private services. See [OWASP's SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html). This local gateway is not a substitute for production egress controls.

For local testing only, an operator can add `SENTINEL_ALLOW_INSECURE_LOOPBACK_TOOLS=true` and allow an exact `http://localhost:PORT`, `http://127.0.0.1:PORT`, or `http://[::1]:PORT` origin. This exception accepts only those loopback hostnames. Do not add an HTTP origin for a non-loopback service.

An organization owner or admin opens **Tools**, enters a target URL, and checks **Enable live execution**. They also create an active allow rule on **Policies** for the same project. Disabling the tool, unchecking execution, or disabling the matching policy stops new dispatches. High and critical risk tools remain disabled until the approval workflow exists. Existing Phase 3 tools remain unconfigured after the migration. The target must accept `POST` with `Content-Type: application/json` and return a JSON response. Redirects are not followed. Target authentication headers are not supported, so choose a target that can safely receive requests from this local gateway without a stored credential. See [policy rules and precedence](policies.md).

## Execute from an agent

Issue an agent key in the same project as the tool. A call requires a new `Idempotency-Key` of 1–128 ASCII letters, digits, dashes, or underscores:

```sh
curl -X POST http://localhost:3000/v1/tools/<tool-id>/execute \
  -H 'Authorization: Bearer <agent-api-key>' \
  -H 'Idempotency-Key: example-call-001' \
  -H 'Content-Type: application/json' \
  --data '{"query":"hello"}'
```

A successful response contains `callId`, `requestId`, and `result` (the target's parsed JSON response). The gateway checks the key's expiry/revocation and agent status, tool organization/project binding, tool status and execution setting, target origin, input schema, and active project policies before any outbound request. A call ID is reserved and audited before dispatch. Reusing a request ID that was reserved for dispatch with the same agent returns `409`, including while a call is pending or after a target failure; the gateway never automatically retries an uncertain action. It forwards `Idempotency-Key` to the target as well. A policy denial returns `403`; an approval rule returns `409` and holds without dispatch until the approval workflow exists. Blocked requests are not reserved and may be retried after policy changes.

The gateway strips duplicate JSON keys by parsing and re-encoding the validated input before forwarding. Neither the input nor target response nor full API key is stored in `tool_calls` or its audit record. Call metadata records pending/succeeded/failed status, target HTTP status, timestamps, a failure code, and the allowing policy rule ID. Blocked policy decisions are audited with metadata only. The dashboard **Tool Calls** metric counts reserved dispatch attempts. If an API key is revoked while a target is processing, the response is withheld from that caller; an already dispatched action cannot be undone.

Limits: 64 KiB request and response, a 10-second target timeout, 100 dispatches per API key per UTC day, 1,000 dispatches per organization per UTC day, and 1,000 audited policy blocks per organization per UTC day. Further blocked attempts return `429` without a new audit record. A non-JSON target response, redirect, upstream error, timeout, or excess response size fails the call. The allowlist and kill switch are checked on every new execution request.

## Current boundary

The local route enforces identity, project scope, JSON shape, explicit opt-in, deterministic policy rules, operator origin allowlisting, quotas, and request deduplication. It does not calculate risk scores or run an approval workflow, prompt-injection checks, or exfiltration detection. The TypeScript SDK remains a stub until Phase 15; use direct HTTP calls for local testing. Avoid enabling a tool whose effects require human review until that workflow is implemented. See the [hosted integration contract](policy-integration.md) before connecting this to D1 and Worker auth.
