# Sentinel — Project Specification

This document is the source of truth for building Sentinel. Coding agents must read it before modifying the project.

## Mission

Sentinel is a production-quality SaaS security control plane that sits between AI agents and the tools/data they can access.

**Core promise:** Control what your AI agents can do.

Sentinel intercepts agent tool calls, evaluates deterministic policies and risk, blocks unauthorized actions, pauses dangerous actions for human approval, detects suspicious/untrusted content, records an audit trail, and identifies abnormal agent behavior.

## Non-negotiable constraints

### Zero recurring owner-paid software usage at launch

- Prefer free/open-source and self-hosted functionality
- Prefer Cloudflare free services where suitable
- Prefer browser-native APIs and deterministic algorithms over paid APIs
- Do **not** require OpenAI/Anthropic/Gemini for core product decisions
- Do **not** depend on paid email/SMS
- Do **not** require Stripe for free launch
- Optional LLM/paid integrations: disabled by default, BYOK when possible
- Hard quotas and kill switches on expensive operations
- Product remains functional if every external AI API is unavailable

### Scale target

Design for 100+ active users, 1,000+ registered users, multiple orgs/agents, and millions of lightweight security events over time. Enforce application quotas before provider quotas.

### Security product rule

Never claim perfect security. Use defense in depth. Never make a critical security decision solely from an LLM response.

### AI coding agent execution

The coding agent has no access to user credentials, API keys, deployment accounts, billing, DNS, or OAuth secrets. It prepares code/configuration and provides exact manual steps for external account actions. It must never claim to have deployed or obtained secrets unless the user confirmed the action.

### No fake functionality

Every visible feature must work end-to-end or be explicitly marked unavailable/not configured.

## Preferred architecture

```
Browser
   |
   v
Cloudflare
   |
   +--> Static/Next.js frontend
   |
   +--> Worker API
           |
           +--> D1
           +--> KV (optional)
           +--> Queues (optional)
           +--> Secrets
```

| Concern | Choice |
| --- | --- |
| Frontend | Next.js, TypeScript, Tailwind, shadcn/ui-style primitives |
| Backend | Cloudflare Worker API; Next.js server routes where useful |
| Database | Cloudflare D1 (preferred); Supabase Postgres only if needed |
| Auth | Self-contained OSS auth with D1 (no Clerk/Auth0 at launch) |
| Realtime | SSE + short polling |
| Cache / rate limits | Cloudflare KV and/or D1 counters |
| AI | Deterministic first; optional BYOK detectors off by default |

Verify current Cloudflare/Supabase free-tier limits before deployment:

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://supabase.com/pricing

## Repository structure

```
sentinel/
├── apps/web/
├── packages/
│   ├── sdk-typescript/
│   ├── sdk-python/
│   └── policy-engine/
├── worker/
├── migrations/
├── tests/
├── docs/
├── scripts/
├── .github/
├── README.md
├── PROJECT.md
└── package.json
```

Modular monolith. Split services only when required.

## Data model (tenant isolation from day one)

Core entities: organizations, organization_members, projects, agents, tools, tool_credentials, policies, policy_rules, agent_runs, tool_calls, approval_requests, security_events, risk_assessments, incidents, api_keys, usage_counters, audit_logs.

Every tenant-owned object must associate with an organization. Never authorize on user ID alone.

## Build phases (do not jump ahead)

| Phase | Focus |
| --- | --- |
| 0 | Planning, monorepo, health endpoint, docs |
| 1 | SaaS foundation (landing, auth, orgs, dashboard shell) |
| 2 | Agent management + API keys |
| 3 | Tool registry + JSON Schema validation |
| 4 | Gateway `POST /v1/tools/{tool_id}/execute` |
| 5 | Deterministic policy engine |
| 6 | Policy UI builder |
| 7 | Human approval workflow |
| 8 | Deterministic risk engine |
| 9 | Audit / activity stream |
| 10 | Prompt injection / untrusted content heuristics |
| 11 | Data exfiltration detection |
| 12 | Behavioral baselines |
| 13 | Automatic response (pause/revoke/incident) |
| 14 | Incident management |
| 15 | TypeScript then Python SDKs |
| 16 | MCP gateway |
| 17 | Interactive sandboxed demo |
| 18 | Attack simulator |
| 19 | Usage limits / cost protection |
| 20 | No-paid-AI architecture enforcement |
| 21 | Testing (unit/integration/security/load) |
| 22 | Deployment (local/staging/production) |
| 23 | Observability |
| 24–27 | Landing polish, docs, marketing, first users |

## Prioritization

```
Security correctness > Core functionality > Reliability > Usability > Performance > Visual polish > Novel features
```

## Definition of done (summary)

A stranger can sign up, create org/agent/tool/policy, generate an API key, send a tool call through Sentinel, see allow/block/approval flows, investigate incidents, and run the attack simulator — with no paid AI API required.

## Current environment (Phase 0 inspection)

| Item | Value |
| --- | --- |
| OS | Windows 10/11 (win32 10.0.26200) |
| Shell | PowerShell 5.1 |
| Node | v22.17.0 |
| npm | 10.9.2 |
| pnpm | 10.27.0 |
| bun | not installed |
| Git | 2.40.0 |
| Docker | not installed |
| Wrangler | not installed globally (add as project dep when Worker work begins) |
| Relevant cloud env vars | none present |

## Agent rules (abbreviated)

- Maintain CHANGELOG.md
- Never commit secrets
- Never bypass authorization to make tests pass
- Prefer deterministic security decisions
- TypeScript strict mode
- Migrations for schema changes
- Keep the app runnable after each phase
- Before completion: lint, typecheck, tests, build, smoke test
