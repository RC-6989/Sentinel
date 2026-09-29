# Sentinel handoff — 2026-09-29

## Current state

Phases 0–5 are complete locally. The public site remains waitlist-gated. Hosted signup, the Worker/D1 gateway, the visual policy builder, and human review are not available yet. Read [PROJECT.md](PROJECT.md) before changing scope; [the work log](docs/work-log.md) preserves the session history.

The combined frontend, gateway, policy, and auth/database preparation changes were committed and pushed to `main` as [`d609319`](https://github.com/RC-6989/Sentinel/commit/d609319211735432e5916d93bb33a4569c1acdf2), following `12c34ce`. Its [CI check](https://github.com/RC-6989/Sentinel/actions/runs/36522692395) and paired [Pages workflow](https://github.com/RC-6989/Sentinel/actions/runs/36522691962) both succeeded. This documentation follow-up records those results. Check `git status`, `git log`, and GitHub CI for later repository changes before starting another session. There is no applicable `AGENTS.md` in this repository.

## What is implemented

- The landing page describes agent tool-call controls using a concrete refund example, with illustrative allow/block/approval states, explicit availability, and a public waitlist. Copy, metadata, icons, mobile navigation, and layout were refined using [the frontend research and strategy](docs/frontend-strategy.md). The demo does not execute a real tool.
- Local signup/login/logout, organizations/projects, agents/API keys, and tool definitions work through Next.js and SQLite. Signup creates the user, owner membership, default project, and audits atomically. Production dashboard access requires an explicit durable data path, persistent-storage confirmation, a real auth secret, and waitlist mode disabled. Those flags cannot make a Vercel filesystem durable.
- The local `POST /v1/tools/{tool_id}/execute` gateway requires a project-bound agent key, an explicitly enabled low/medium-risk tool, an operator-allowlisted exact HTTPS origin, schema-valid input, and an allowing policy. It reserves idempotency and metadata audits before dispatch, enforces quotas, bounds requests/responses and time, and does not store payloads. See [gateway behavior and limits](docs/gateway.md).
- Phase 5 provides a bounded, deterministic, portable policy evaluator and a project-scoped JSON policy editor. Deny overrides approval, which overrides allow; no matching allow denies. Policy authorization and dispatch reservation share a transaction. Denial and approval-required decisions do not dispatch; invalid active rules fail closed. Blocked audits have an organization quota. See [policy behavior](docs/policies.md).
- High/critical-risk execution remains disabled. An approval policy returns a hold; it does not create a reviewer workflow. Exact-origin checks also need production outbound-network protection because they do not pin DNS.
- The internal D1 account/session store supports atomic workspace creation, normalized unique email, opaque hashed session tokens, expiry, and revocation. It has no public API or Next.js adapter yet. The Worker entry remains a deployment stub.
- Bundled, licensed local fonts avoid the earlier Google Fonts build dependency. Preserve their provenance and the plain-object conversion of SQLite rows passed to React.

## Staging database and user setup

The user created `sentinel-staging` in ENAM, database ID `079c720c-db3e-44e1-a903-b4129a70ff24`. `worker/wrangler.toml` references it only under `env.staging`, using binding `DB` and the shared `../migrations` directory. The generated label `sentinel_staging` was changed to `DB` to match the storage integration; the database itself was not renamed.

All six migrations (`0000`–`0005`) were discovered and applied successfully to the **local D1 simulation** using `--local --env staging`. Remote tables, hosting secrets, and deployment were not changed or confirmed. The default Worker environment has no production database binding.

No Clerk, Auth0, Supabase, or AI API keys are required for this plan. No additional external setup is needed from the user while the hosted adapter is being built. When staging is ready, the user must apply its remote migrations and configure the final server-only secrets in the hosting consoles. Do not request or commit credentials. See [the auth/database rollout](docs/auth-db-rollout.md).

## Auth and database next steps

1. Implement protected, typed Worker account/session endpoints and a Next.js server adapter. Keep browser requests on the site origin. Use server-only service authentication; never expose a Cloudflare token or a generic SQL endpoint. Preserve existing Node `scrypt` password verification compatibility and use an opaque HttpOnly session cookie for the hosted flow.
2. Move organizations, projects, memberships, agents, keys, tools, policies, calls, and audits to the same D1 backend. Do not connect hosted signup while the dashboard or gateway still reads local SQLite. Preserve tenant authorization, key revocation, quotas, and atomic policy/call reservation as specified in [the integration contract](docs/policy-integration.md).
3. Add durable signup/login abuse throttles and a usable account recovery path without paid email/SMS. Both are public self-service release blockers.
4. Apply the ordered migrations to isolated remote staging through manual user setup. Verify signup rollback, email uniqueness, session expiry/revocation, and all product flows across fresh instances. Test cross-tenant denial, bounded dispatch, quotas, idempotency, and secret handling.
5. Open hosted auth only after the staging release gate passes and every visible action uses durable storage. Keep the public gate closed until then. Recheck provider free-plan limits before deployment.

Product roadmap: Phase 6 is the visual policy builder using the existing rule format. Phase 7 adds durable human approval. Neither phase should silently expand execution eligibility or bypass the hosted storage release gate.

## Verification and local tooling

Final combined checks on 2026-09-29 passed: `pnpm lint`, `pnpm typecheck`, `pnpm test` (58 tests: 51 web, 4 policy-engine, 3 Worker), `pnpm build`, and local staging D1 migrations. The updated frozen lockfile was verified in the policy workstream. The web runner explicitly preloads `tsx`, so shared TypeScript tests do not depend on recent Node automatic type stripping.

Recorded Chromium/HTTP smoke checks passed local signup → dashboard → logout → login, persistence across restart, tenant isolation, policy creation, default deny, deny/approval precedence, validation, allowed execution, deduplication, disabling, and exactly one outbound target request. Marketing was checked at 320/390/768 px with no horizontal overflow or browser exceptions. A temporary real Wrangler D1 binding also passed account creation, credential lookup, session resolution, and revocation. See [the work log](docs/work-log.md) for details. Temporary smoke servers were stopped; their data is not product data. No new runtime changes followed those smoke checks.

The temporary Node Corepack installation is incomplete. The working local launcher is:

```sh
export PATH=/private/tmp/sentinel-phase5-bin:/private/tmp/node-v22.23.3-darwin-arm64/bin:$PATH
pnpm --version
```

It runs pnpm 10.27.0 with Node 22.23.3. `node_modules` links to `/tmp/sentinel-pnpm-store/v10`; use `--store-dir /tmp/sentinel-pnpm-store` if reinstalling in this workspace. These temporary paths may disappear; a normal Node >=22.13 / pnpm 10.27.0 installation is the portable setup. See [environment notes](docs/environment.md).

Future runtime changes require appropriate tests, lint, typecheck, build, and smoke verification. Do not assume GitHub CI passed merely because the local checks did.
