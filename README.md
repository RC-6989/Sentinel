# Sentinel

**Control what your AI agents can do.**

Sentinel is a security control plane that sits between AI agents and the tools/data they can access. It intercepts tool calls, evaluates deterministic policies and risk, blocks unauthorized actions, pauses dangerous actions for human approval, detects suspicious content, records an audit trail, and identifies abnormal agent behavior.

## Core promise

Defense in depth for autonomous agents — without requiring paid LLM inference for security decisions.

## Status

Phase 0 foundation. See [PROJECT.md](./PROJECT.md) and [CHANGELOG.md](./CHANGELOG.md).

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

- Node.js 20+
- pnpm 10+

## Quick start (local)

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Environment

Copy `.env.example` to `.env.local`. Never commit secrets.

## Cost & constraints

- Zero required owner-paid software usage at launch
- Core security decisions are deterministic (no paid LLM required)
- Optional AI features are BYOK and disabled by default
- Application-enforced quotas protect free-tier infrastructure limits

## License

Proprietary / portfolio project — licensing TBD.
