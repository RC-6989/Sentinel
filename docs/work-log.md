# Work log

Update this file when a development session changes phase status, verification results, or the next action. Keep historical entries and correct the current state in `SESSION_HANDOFF.md` before stopping.

## 2026-09-27 — Phase 3 and CI recovery

- Investigated CI failure at `3f3b868`: Next.js `next/font/google` loader crashed on an unexpected font URL during the production build; lint, tests, and typecheck had passed.
- Bundled IBM Plex Sans, IBM Plex Mono, and Syne with local font imports and licenses; clean production build passed with Google Font requests disabled.
- Implemented project-scoped tool definitions, bounded JSON Schema validation, UI forms, audit records, migration `0003_tools.sql`, and service tests.
- Browser smoke exposed a React serialization crash from `node:sqlite` null-prototype rows. Converted query results passed to client components into plain objects.
- Lint, typecheck, 24 service tests, and build passed. Work was committed to `12c34ce` alongside frontend updates and pushed; both GitHub workflows succeeded.

## 2026-09-27 — Resumed session

- Confirmed `main` and `origin/main` at `12c34ce`, clean working tree, and both current GitHub workflows green.
- Finished a Chromium browser smoke check: signup, registration, valid/invalid input, schema/risk edits, disable/re-enable, persistence, organization isolation, mobile layout, bundled fonts, and no browser exceptions all passed. A prior selector timeout and a font-load assertion were issues in the temporary smoke script, not observed app failures.
- Next: implement Phase 4's local execution gateway with explicit owner opt-in and server allowlisting, then verify its auth, validation, dispatch, and failure behavior. Policy enforcement and Worker/D1 deployment remain later phases.

## 2026-09-27 — Phase 4 local gateway

- Added `0004_tool_execution.sql` and registered it in the ordered local SQLite migrations. Existing tools remain execution-disabled. The migration stores call identity, status, target HTTP status, failure code, and timestamps without request or response payloads.
- Added the Node/SQLite `POST /v1/tools/{tool_id}/execute` route. Agent keys are bound to their project; tools require owner/admin opt-in, low or medium risk, an operator-allowlisted target origin, and schema-valid JSON. Calls reserve an idempotency key and audit record before dispatch. The route bounds body/response sizes, target time, and daily key/organization volume. It does not apply policy rules yet.
- Added target configuration to tool forms, an actual gateway call count to the dashboard, environment examples, and [gateway setup and limits](gateway.md). The Cloudflare Worker and TypeScript SDK remain stubs for execution.
- Verification: 41/41 web tests, lint, typecheck, `git diff --check`, and `pnpm --filter @sentinel/web build` passed. A Chromium + HTTP smoke check passed signup, key issuance, tool default-off, schema rejection, live dispatch, duplicate-call rejection, disabling, and a single outbound target request. An intermediate smoke assertion failed because its temporary echo server retained a prior call count; comparing against the starting count resolved the harness issue.
- Parallel work is in progress on hosted auth/database and marketing UI. Gateway changes are isolated from those workstreams except the single migration-list addition in `apps/web/src/lib/db.ts`. The hosted rollout must preserve the gateway's API-key identity, project scope, ordered migration, and durable call reservation/audit semantics. See [auth/database rollout](auth-db-rollout.md).
- Next: integrate Phase 5 policy decisions before expanding execution to high/critical risk or hosted traffic. Retest the combined tree after the concurrent auth/database and frontend changes settle. Do not treat this local route as a hosted gateway.

## 2026-09-28 — Parallel auth/database preparation

- Reviewed the existing auth, SQLite schema, production route gate, and the concurrent gateway/policy work. Added [the hosted rollout plan](auth-db-rollout.md); preserve its single-datastore release gate and [policy integration contract](policy-integration.md).
- Made local signup atomic across the user, owner membership, default project, and audit records. Organization creation uses a savepoint so it can participate in signup's transaction. Added rollback and duplicate-email tests and a visitor-facing failure message.
- Production dashboard access now requires an explicit durable data path, persistent-storage confirmation, a non-placeholder auth secret, and the opt-out from waitlist mode. This does not make Vercel's filesystem durable.
- Added an internal D1 account/session store in `worker/src/account-store.ts` with transactional workspace creation, normalized unique email, opaque hashed session tokens, expiry, and revocation. No public Worker route or Next.js adapter is wired yet. Password verification remains in the existing Node auth path; abuse throttles and recovery are still release blockers.
- Verification: combined lint, typecheck, 50 web tests, 4 policy-engine tests, and 3 Worker tests passed. The production build passed. A Chromium production-configured local signup → dashboard → logout → login flow passed, and the session/workspace survived a server restart. Migrations `0000`–`0004` applied to Wrangler local D1; a temporary local Worker passed account creation, credential lookup, session resolution, and revocation against its real D1 binding.
- Updated marketing/auth availability copy as Phase 5 arrived locally; human review and hosted enforcement remain unavailable. Next: protected Worker auth endpoints and the Next.js server adapter, then move all user-facing org/project/agent/tool/policy/gateway operations to the same D1 store before opening public auth.

## 2026-09-28 — Phase 5 deterministic policy enforcement

- Replaced the policy package stub with a bounded, portable evaluator. Rules match exact tool/agent/environment/risk fields and optional scalar argument conditions; deny overrides approval, then allow. No matching allow denies. The package has no database, auth, Node, or network dependency.
- Added ordered migration `0005_policies.sql`, project-scoped policy storage, membership/owner/admin authorization, same-project reference checks, transactional audits, and a working JSON policy editor. The visual builder remains Phase 6.
- Integrated policy checks into the local gateway before dispatch reservation. Blocked/approval-required calls audit metadata and never reach the target; invalid stored active rules fail closed. Allowed calls retain the matching policy rule ID. Added a 1,000-block-per-org UTC daily audit cap and a real blocked-action dashboard count. High/critical risk tools remain disabled pending human approval support.
- Wrote [policy behavior](policies.md) and [the hosted auth/D1 integration contract](policy-integration.md). The latter specifies portable interfaces, migrations `0004` → `0005`, membership/key identity checks, atomic reservation/audit requirements, timestamp semantics, and blocked-audit limits. Preserved the parallel auth/database and frontend changes.
- Verification: frozen-lockfile install, lint, typecheck, 58 total tests (51 web, 4 policy-engine, 3 Worker), production build, and `git diff --check` passed. Final Chromium/HTTP smoke passed local signup, key issuance, default deny, JSON policy creation, deny/approval precedence, allowed execution, schema rejection, deduplication, tool disablement, exactly one outbound request, and no browser exceptions. Early smoke attempts exposed a missing temporary production-gate flag and a stale sidebar “soon” label; the flag was supplied and the label corrected. Temporary servers were stopped.
- All work remains uncommitted on `main` at `12c34ce`. Next: Phase 6 visual policy builder. Hosted auth/public execution stays gated until the D1 work covers every user-facing operation; a policy approval effect remains a hold, not a reviewer workflow.

## 2026-09-29 — Policy package test-runner portability

- Made the web test runner preload `tsx` for the shared policy TypeScript source rather than depending on a recent Node 22 automatic-loading feature. All 58 tests passed with automatic type stripping disabled; the updated frozen lockfile passed installation.
- The temporary Node Corepack directory became incomplete in the shared environment. Prepared an isolated pnpm 10.27.0 launcher under `/tmp/sentinel-phase5-bin`; put it before `/tmp/node-v22.23.3-darwin-arm64/bin` on `PATH` for local reruns. This changed no product runtime code. Phase 6 remains next; the current tree is still uncommitted.

## 2026-09-29 — User-created staging D1 configuration

- User confirmed `sentinel-staging` was created in ENAM. Added its database ID to `worker/wrangler.toml` under the explicit staging environment, with binding `DB` and `migrations_dir = "../migrations"`. No production binding or remote schema change was made.
- The returned `sentinel_staging` binding label was normalized to `DB` to match the account-store integration. See [local migration commands and rollout state](auth-db-rollout.md).
- Verified the staging configuration discovers all six shared migrations (`0000`–`0005`) and applies them successfully to Wrangler's local D1 simulation. Remote schema, hosting secrets, and deployment remain untouched.

## 2026-09-29 — Combined frontend and Phase 5 handoff

- Refined the landing page around “Set the rules before agents act” and a concrete refund workflow, with an illustrative policy decision example, specific capability copy, explicit local/hosted availability, metadata, icons, and responsive navigation/layout. [Frontend strategy](frontend-strategy.md) records the research, positioning decisions, and primary sources. Chromium checks at 320/390/768 px and a local waitlist submission passed without overflow or browser exceptions.
- Reconciled the concurrent local gateway, deterministic policies, signup hardening, D1 account/session foundation, and marketing changes. Phases 0–5 are complete locally. Phase 6 is next; the approval effect still only holds a call, and hosted auth/gateway services remain unavailable.
- Rewrote [the session handoff](../SESSION_HANDOFF.md) around the final shared state and exact auth/database next steps: protected typed Worker endpoints, same-origin Next.js adapter, one durable datastore for every product flow, durable abuse throttles and recovery, then isolated staging verification before opening auth. No paid auth/AI provider keys are required. No additional user setup is needed during implementation.
- Updated environment notes for the working pnpm launcher, corrected the waitlist webhook payload guidance, and marked unused Cloudflare environment placeholders clearly.
- Final combined verification: lint, typecheck, all 58 tests (51 web, 4 policy-engine, 3 Worker), production build, and all six local staging D1 migrations passed. Earlier end-to-end Chromium/HTTP and actual local D1-binding smoke results are recorded above; the final edits after those checks are documentation/configuration only. Temporary smoke servers were stopped and local runtime data remains ignored.
- User authorized committing and pushing the complete shared changes on `main`. This entry accompanies that combined commit; use Git history and GitHub Actions for its final revision and remote CI result. Local completion does not imply deployment or hosted auth readiness.

## 2026-09-29 — Commit, push, and remote verification

- Committed the combined changes as [`d609319`](https://github.com/RC-6989/Sentinel/commit/d609319211735432e5916d93bb33a4569c1acdf2), “Complete local policy enforcement and prepare hosted auth,” and pushed to `origin/main`. Confirmed GitHub's `main` points to that revision and the local working tree was clean.
- Staged diff validation passed; the 62 staged paths contained no detected private-key or common credential-token patterns. Ignored runtime databases, Wrangler state, dependency caches, and temporary smoke artifacts were excluded.
- GitHub [CI run 36522692395](https://github.com/RC-6989/Sentinel/actions/runs/36522692395) passed frozen-lockfile install, lint, all tests, typecheck, and the production build. The paired [Pages workflow 36522691962](https://github.com/RC-6989/Sentinel/actions/runs/36522691962) also succeeded. This documentation follow-up records the verified result; it does not enable hosted auth or deploy a D1-backed API.
- Next work remains the Phase 6 visual builder and the gated auth/database integration sequence in [the handoff](../SESSION_HANDOFF.md) and [rollout plan](auth-db-rollout.md). The user has no further setup to perform until that implementation is ready for staging.
