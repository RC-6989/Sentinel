# Hosted authentication and database rollout

Status: hosted integration pending (2026-09-29). Phases 0–5 are complete locally; the public deployment remains a waitlist. This file records the account/session storage and release plan shared with the gateway/policy workstream. Do not enable public signup until the end-to-end checks below pass.

## Staging resource setup (2026-09-29)

The user confirmed creation of D1 database `sentinel-staging` in ENAM, ID `079c720c-db3e-44e1-a903-b4129a70ff24`. `worker/wrangler.toml` now defines it under `env.staging` with binding name `DB`, matching the storage service's expected binding. The name is an in-code reference; changing it from the generated `sentinel_staging` does not rename the database. `migrations_dir` points to the shared repository migrations. The default production environment has no D1 database configured.

From `worker/`, local-only migration commands are:

```sh
pnpm dlx wrangler d1 migrations list sentinel-staging --local --env staging
pnpm dlx wrangler d1 migrations apply sentinel-staging --local --env staging
```

All six migrations (`0000`–`0005`) were discovered and applied successfully with `--local --env staging` on 2026-09-29. These commands use a local simulation. Remote tables, secrets, hosted auth routes, and Worker deployment are not yet confirmed. Keep public auth gated; do not run `wrangler deploy` or switch these commands to `--remote` until the hosted integration and staging release checks are ready.

No further account setup or API keys are needed from the user during implementation. The chosen auth path requires no Clerk/Auth0/Supabase or AI credentials. D1 is accessed through the Worker binding, not through the commented Cloudflare environment placeholders in `.env.example`. When the protected API and adapter are ready, document the exact server-only secret names and manual hosting steps before asking the user to configure them.

## What exists

- Local Next.js server actions implement signup, login, logout, and organization creation. Sessions, users, organizations, projects, agents, tools, and calls are stored in one `node:sqlite` file. Tenant-owned records carry organization IDs.
- Production routes redirect `/signup`, `/login`, and `/app` to the public waitlist by default. The Vercel marketing deployment cannot persist `node:sqlite` across serverless instances ([Vercel storage guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel)).
- The gateway and Phase 5 policy checks run in the local Node/SQLite app. The Cloudflare Worker gateway is a stub. No hosted account can safely use the dashboard or gateway yet. Preserve the contract in [policy integration](policy-integration.md) during migration.

## Chosen path

Keep the public Next.js site and use a typed Cloudflare Worker API backed by D1 for durable user and product data. D1 is the preferred database in `PROJECT.md`; its Worker binding supports transactional batches and local simulation ([D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)). Do not put a Cloudflare API token in the browser or expose a generic SQL endpoint. Keep browser requests on the site origin; Next.js server routes/actions can pass an opaque, HttpOnly session token to typed Worker endpoints. The Worker must validate membership and project scope on every request. Existing SQLite remains the local development backend until a full flow is migrated.

The first D1 account/session storage slice now lives in `worker/src/account-store.ts`, with transaction and session tests. It is deliberately not routed publicly. A temporary local Worker exercised account creation, credential lookup, session resolution, and revocation through a real D1 binding; the final staging configuration also applied all migrations through `0005` locally. Preserve their order in the hosted sequence. Next comes a protected Worker auth API and Next.js server-side adapter, followed by project, agent, tool, policy, and gateway operations. The local password hashes use Node `scrypt`; preserve verification compatibility or explicitly migrate hashes rather than silently creating a second password format. Keep password verification server-side in the Next.js Node runtime until a Worker-safe design is measured against the free-plan CPU budget. Migration files need a single ordered D1 application path; the local `schema_migrations` table and Wrangler's own migration table must not be mistaken for each other.

Do not route a hosted signup to D1 while the dashboard still reads a separate SQLite file. That would produce a valid account with an empty or broken workspace. Keep hosted auth disabled until signup, login, session persistence, org/project creation, agent and tool operations, and gateway calls all use the same durable store.

## Release gate for actual users

1. Staging D1 is provisioned and configured; production provisioning remains a manual user step. Set final server-only secrets in hosting consoles when the API is ready. The coding agent must not obtain account credentials or perform external account setup.
2. Apply migrations to a local D1 simulation, then to an isolated staging D1; verify foreign keys, case-insensitive email uniqueness, and rollback of a failed signup.
3. Add durable signup/login abuse throttles and an account recovery path that do not require paid email or SMS. These are missing from the current local auth path and block public self-service signup.
4. Browser-test a stranger's signup → dashboard → logout → login flow across fresh instances, including persistence after restart and duplicate-email handling. Test two organizations for cross-tenant denial.
5. Test agent/key/tool creation and a bounded gateway call on the same backend; verify revocation, quotas, failure handling, and no secret leakage.
6. Keep the public gate closed until production storage, secrets, quotas, health, and smoke checks are ready. Show a clear unavailable state for any unfinished feature.

Cloudflare currently lists a Workers Free allowance of 100,000 requests per day and D1 Free allowances of 5 million rows read and 100,000 rows written per day ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)). These are ceilings, not Sentinel quotas: enforce lower application limits and fail closed when provider limits are reached. Recheck the provider limits before launch.
