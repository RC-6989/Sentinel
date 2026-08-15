# Changelog

All notable changes to Sentinel are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Phase 1 SaaS foundation: signup/login, organizations, projects, dashboard shell
- Local SQLite persistence via `node:sqlite` (D1-compatible schema)
- Marketing landing with animated Sentinel pipeline preview
- Settings: profile, org details, create project/organization
- Explicit "not available yet" pages for Agents–Incidents (no fake success)

### Planned

- Phase 2: Agent management + API keys
- Phase 3+: Tools, gateway, policies, approvals, SDKs

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
