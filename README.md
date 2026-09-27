# Sentinel

**Control what your AI agents can do.**

**Landing page live at http://trysentinelapp.vercel.app**

Sentinel is a security control plane that sits between AI agents and the tools/data they can access. It intercepts tool calls, evaluates deterministic policies and risk, blocks unauthorized actions, pauses dangerous actions for human approval, detects suspicious content, records an audit trail, and identifies abnormal agent behavior.

## Core promise

Defense in depth for autonomous agents — without requiring paid LLM inference for security decisions.

## Status

Phase 3 implemented locally: authentication, organizations/projects, agents, scoped API keys, and a tool registry with risk classification and JSON Schema input validation. The Worker gateway is still a stub; execution is next (Phase 4). See [PROJECT.md](./PROJECT.md) and [CHANGELOG.md](./CHANGELOG.md).

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

Local development exposes `/signup`, `/login`, and `/app`. Production remains in waitlist mode unless `SENTINEL_WAITLIST_MODE=false` is explicitly set. The dashboard currently requires a persistent local SQLite filesystem; it is not ready for serverless deployment.

See [agent and API key setup](docs/agents.md) and [tool registration and input validation](docs/tools.md) for usage and verification. Fonts are bundled locally, so builds do not need access to Google Fonts.

## Cost & constraints

- Zero required owner-paid software usage at launch
- Core security decisions are deterministic (no paid LLM required)
- Optional AI features are BYOK and disabled by default
- Application-enforced quotas protect free-tier infrastructure limits

## License

Proprietary / portfolio project — licensing TBD.
