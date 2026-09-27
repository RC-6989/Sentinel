# Changelog

All notable changes to Sentinel are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Phase 2: project-scoped agent creation, editing, and pause/resume controls
- Agent API keys with one-time disclosure, hashed storage, expiry, atomic rotation, and revocation
- Bearer identity verification endpoint at `GET /api/v1/identity`
- Tenant and role checks, composite foreign keys, and transactional audit records
- Organization switching across dashboard, agents, and settings
- Ten service/security tests, now included in CI

### Fixed

- Allow local dashboard access while retaining the production waitlist gate
- Run ESLint directly and apply migrations transactionally
- Document the Node.js 22.13+ requirement and correct local environment path

### Existing

- Phase 1 SaaS foundation: signup/login, organizations, projects, dashboard shell
- Local SQLite persistence via `node:sqlite` (D1-compatible schema)
- Marketing landing with animated Sentinel pipeline preview
- Settings: profile, org details, create project/organization
- Explicit "not available yet" pages for Tools–Incidents (no fake success)

### Planned

- Phase 3: Tool registry + JSON Schema validation
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
