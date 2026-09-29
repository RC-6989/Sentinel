# Changelog

All notable changes to Sentinel are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Phase 5 fail-closed deterministic policy engine with bounded JSON rules, exact context/argument matches, and deny-over-approval-over-allow precedence
- Project-scoped policy storage, owner/admin JSON editor, tenant/project authorization, transactional audit records, and policy IDs on allowed calls
- Gateway policy enforcement before outbound dispatch; denied and approval-required calls stop and audit without storing arguments
- Policy engine, service, and gateway tests, plus hosted auth/D1 integration contract
- Phase 4 local Node/SQLite gateway at `POST /v1/tools/{tool_id}/execute` for explicitly enabled, project-scoped low/medium risk tools
- Operator target-origin allowlist, HTTPS by default, global execution kill switch, per-key and per-organization daily quotas, request ID deduplication, target timeout, and bounded JSON responses
- Call metadata and audit reservation before dispatch, with no stored input, result, or full API key
- Gateway security tests for identity/scope, input validation, opt-in, target allowlisting, failures, retries, quota, audit rollback, and revocation during execution

- Frontend content audit and research notes in `docs/frontend-audit.md`
- Frontend positioning strategy, a branded site icon, and a generated link-preview image
- Hosted auth/database rollout plan and a production dashboard gate requiring explicit durable storage and a real auth secret
- Internal D1 account/session store with atomic workspace creation and opaque revocable sessions; public routes remain disabled
- Staging-only D1 binding and shared migration directory for the user-created `sentinel-staging` database
- Clearly labeled, user-controlled tool-call examples and public build status

- Phase 3: project-scoped tool registration, editing, risk classification, and active/disabled controls
- Saved JSON Schema input definitions and a member-accessible sample-input validator (no execution)
- Bounded draft-07 schema subset using Ajv with strict validation, no coercion, and explicit unsupported-feature rejection
- Tool tenant/role isolation, composite foreign keys, per-project unique names, and transactional audit records
- Fourteen tool/schema security tests alongside the ten existing agent tests
- Bundled IBM Plex Sans, IBM Plex Mono, and Syne fonts with licenses and source provenance
- Phase 2: project-scoped agent creation, editing, and pause/resume controls
- Agent API keys with one-time disclosure, hashed storage, expiry, atomic rotation, and revocation
- Bearer identity verification endpoint at `GET /api/v1/identity`
- Tenant and role checks, composite foreign keys, and transactional audit records
- Organization switching across dashboard, agents, and settings
- Ten service/security tests, now included in CI

### Fixed

- Replace invented SDK usage, simulated live activity, risk scores, and inactive approval controls with an honest explanation of the planned product
- Replace unavailable dashboard metrics and auth security claims with explicit availability states
- Rework marketing hierarchy, responsive layout, focus indicators, email labels, feedback, and contrast; remove decorative autoplay
- Sharpen the homepage promise around deciding before agent actions, with concrete refund examples and accurate build-stage labels
- Make signup create the user, first organization, project, and audit record atomically; return a usable error if account creation fails

- Convert SQLite query rows to plain objects before passing them to React client components, fixing the post-signup dashboard crash
- Remove build-time Google Fonts requests that could trigger Next.js 15.5.7's font URL extension parser failure in GitHub CI
- Allow local dashboard access while retaining the production waitlist gate
- Run ESLint directly and apply migrations transactionally
- Document the Node.js 22.13+ requirement and correct local environment path

### Existing

- Phase 1 SaaS foundation: signup/login, organizations, projects, dashboard shell
- Local SQLite persistence via `node:sqlite` (D1-compatible schema)
- Marketing landing with illustrative tool-call scenarios and early-access waitlist
- Settings: profile, org details, create project/organization
- Explicit "not available yet" pages for Approvals–Incidents (no fake success)

### Planned

- Phase 6+: Visual policy builder, approvals, Worker/D1 deployment, SDKs

## [0.1.0] — 2026-08-14

### Added

- Monorepo scaffold (`apps/web`, `packages/*`, `worker`, `migrations`, `tests`, `docs`, `scripts`)
- Next.js 15 + TypeScript + Tailwind web app
- `GET /api/health` health endpoint
- Root docs: `README.md`, `PROJECT.md`, `CHANGELOG.md`
- `.env.example` and `.gitignore`
- Stub packages: `@sentinel/policy-engine`, `@sentinel/sdk`, Python SDK placeholder
- Cloudflare Worker stub (`worker/`)
- Git repository initialized on `main` with `development` branch
