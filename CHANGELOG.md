# Changelog

All notable changes to Sentinel are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Frontend content audit and research notes in `docs/frontend-audit.md`
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
- Explicit "not available yet" pages for Policies–Incidents (no fake success)

### Planned

- Phase 4+: Gateway, policies, approvals, SDKs

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
