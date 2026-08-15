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

## Manual steps required later (not done by agent)

1. Create a Cloudflare account (free)
2. Install Wrangler: `pnpm add -D wrangler` in `worker/` (or use `pnpm dlx wrangler`)
3. `wrangler login` (interactive — user only)
4. Create D1 database and paste IDs into `worker/wrangler.toml`
5. Deploy when Phase 22 begins

Do not claim any of the above is complete until the user confirms.
