# Environment notes (Phase 0)

Captured 2026-08-14 during Step 0.1.

| Tool | Status |
| --- | --- |
| Node.js | v22.17.0 |
| npm | 10.9.2 |
| pnpm | 10.27.0 (package manager for this monorepo) |
| bun | Not installed — not required |
| Git | 2.40.0 |
| Docker | Not installed — not required for Phase 0 |
| Wrangler CLI | Not installed globally — add as project dependency when Worker work starts |
| Cloudflare / Supabase credentials | Not present — user must create accounts manually later |

## Current setup (2026-09-29)

The user confirmed Cloudflare setup and creation of `sentinel-staging` in ENAM. Its non-secret database ID is configured under `env.staging` in `worker/wrangler.toml`, binding `DB`. All six shared migrations applied to the local D1 simulation; no remote schema or deployment was changed. See [the rollout plan](auth-db-rollout.md).

The shared macOS workspace was verified using Node 22.23.3 and pnpm 10.27.0. The temporary Corepack installation is incomplete, so the working launcher is:

```sh
export PATH=/private/tmp/sentinel-phase5-bin:/private/tmp/node-v22.23.3-darwin-arm64/bin:$PATH
pnpm --version
```

These paths are temporary. For a permanent setup, install Node >=22.13 and pnpm 10.27.0. Wrangler need not be installed globally; local checks used `pnpm dlx wrangler@4.142.0`. Existing `node_modules` uses `/tmp/sentinel-pnpm-store`; supply `--store-dir /tmp/sentinel-pnpm-store` if reinstalling in this workspace.

## Remaining manual setup

No new API keys are needed while the hosted integration is being built. Once its release gate passes, the user must apply remote staging migrations, configure the final server-only secrets, and deploy through their own accounts. Production provisioning comes later. Do not open hosted auth or represent local verification as a remote deployment.
