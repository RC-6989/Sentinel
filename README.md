# Sentinel

**Control what your AI agents can do.**

**Landing page live at http://trysentinelapp.vercel.app**

Sentinel is a security control plane that sits between AI agents and the tools/data they can access. It intercepts tool calls, evaluates deterministic policies and risk, blocks unauthorized actions, pauses dangerous actions for human approval, detects suspicious content, records an audit trail, and identifies abnormal agent behavior.

## Core promise

Defense in depth for autonomous agents — without requiring paid LLM inference for security decisions.

## Status

Phases 0–5 are implemented locally: authentication, organizations/projects, agents, scoped API keys, a tool registry with JSON Schema input validation, an opt-in HTTP execution gateway, and fail-closed deterministic project policies. The Cloudflare Worker gateway and hosted auth/database integration are still in progress; a visual policy builder and human approval workflow come later. See [PROJECT.md](./PROJECT.md), [policy documentation](docs/policies.md), and [CHANGELOG.md](./CHANGELOG.md).

## Stack (planned)

| Layer | Choice |
| --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| API | Cloudflare Workers (primary) + Next.js routes where useful |
| Database | Cloudflare D1 |
| Auth | Self-contained open-source auth (no Clerk/Auth0 at launch) |
| Realtime | SSE + short polling fallback |
| AI | Deterministic first; optional BYOK LLM detectors (off by default) |

## Repository layout

```
sentinel/
├── apps/web/                 # Next.js app (marketing + dashboard)
├── packages/
│   ├── sdk-typescript/       # @sentinel/sdk
│   ├── sdk-python/           # sentinel-sdk
│   └── policy-engine/        # Deterministic policy evaluation
├── worker/                   # Cloudflare Worker API gateway
├── migrations/               # D1 / SQL migrations
├── tests/                    # Cross-cutting integration/security tests
├── docs/                     # Product & ops docs
└── scripts/                  # Dev/ops scripts
```

## Prerequisites

- Node.js 22.13+ (required for `node:sqlite`)
- pnpm 10+

## Quick start (local)

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Environment

Copy `.env.example` to `apps/web/.env.local`. Never commit secrets.

Local development exposes `/signup`, `/login`, and `/app`. Production remains in waitlist mode unless it is explicitly opened on a host with persistent SQLite storage, a real `AUTH_SECRET`, `SENTINEL_DATA_DIR`, and `SENTINEL_PERSISTENT_STORAGE_CONFIRMED=true`. The dashboard is not ready for serverless deployment. See the [hosted auth and database rollout](docs/auth-db-rollout.md) before opening it to users.

See [agent and API key setup](docs/agents.md), [tool registration and input validation](docs/tools.md), and [the local gateway](docs/gateway.md) for usage and verification. Fonts are bundled locally, so builds do not need access to Google Fonts.

## Cost & constraints

- Zero required owner-paid software usage at launch
- Core security decisions are deterministic (no paid LLM required)
- Optional AI features are BYOK and disabled by default
- Application-enforced quotas protect free-tier infrastructure limits

## License

Proprietary / portfolio project — licensing TBD.
