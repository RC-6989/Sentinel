# Sentinel handoff — 2026-09-27

## Repository state

- Workspace: `/Users/rohitchavali/Desktop/Sentinel`
- Branch: `main`, at `3f3b8680953b8146a56313e23bfa540baa5e17f1` (`Working on backend`); same commit as `origin/main` when checked.
- Work is intentionally **uncommitted and unpushed**. The user asked to save progress and stop for now.
- Preserve the whole current working tree. In particular, there are simultaneous landing page/marketing updates, a new `docs/frontend-audit.md`, and removed/replaced marketing components mixed into the tree. They were not reverted. The font changes in `apps/web/src/app/layout.tsx` overlap a concurrent branding/CSS update; keep both the local font imports and the current metadata/CSS variables.
- There is no applicable `AGENTS.md` in this repository.

## Why the GitHub check failed

The latest push at this commit had two workflow runs. The `CI / check` run [36285635420](https://github.com/RC-6989/Sentinel/actions/runs/36285635420) passed install, lint, tests (10/10), and typecheck, then failed during `pnpm --filter @sentinel/web build`. The log puts the error in Next.js 15.5.7's `next/font/google` loader: it calls `[...].exec(googleFontFileUrl)[1]` without checking for a regex match. A Google Fonts response with any URL that does not end in `.woff`, `.woff2`, `.eot`, `.ttf`, or `.otf` causes the reported `Cannot read properties of null (reading '1')`. The workflow run paired with it, [36285635236](https://github.com/RC-6989/Sentinel/actions/runs/36285635236), succeeded. Local current Google Fonts CSS did not reproduce the anomalous response, but the Google fetch is a build-time network dependency and the loader assumption is unguarded.

The fix now uses `next/font/local` and bundles the three existing fonts (IBM Plex Sans, IBM Plex Mono, Syne), their SIL OFLs, source URLs, and SHA-256 provenance under `apps/web/src/app/fonts/`. A fresh build passed with an empty `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` map, which ensures any Google-font lookup would fail. No `next/font/google` import remains under `apps/web/src`.

## Work completed in this session

1. Removed the font fetch at build time and retained local font use and licensing.
2. Implemented Phase 3 tool registry: new SQLite/D1-compatible `migrations/0003_tools.sql`, automatic SQLite migration, project-bound tenant-scoped tools, risk classification, active/disabled status, owner/admin writes, member reads, unique per-project names, composite organization/project foreign keys, transactional audit records, and server-rendered tools page.
3. Added bounded draft-07 object JSON Schema validation using Ajv. It rejects unsupported schema keywords, coercion, excessive input/schema sizes, structural complexity, and Ajv's silently ignored `__proto__` property. The tester never stores sample input, authorizes a tool call, or executes a tool. Phase 4 execution and Phase 5 policy enforcement remain future work.
4. Added tests: existing 10 agent tests plus 14 tool/schema tests (24 total); tests also verify SQLite results become plain objects before React serialization.
5. Updated project/phase/readme/changelog/docs, added `docs/tools.md`, and linked [PROJECT.md](./PROJECT.md) to this handoff.
6. Browser smoke testing exposed a real pre-existing Phase 2 crash: `node:sqlite` query rows have null prototypes, and Next/React cannot serialize organization rows passed into client components (`Only plain objects ...`). `listOrganizationsForUser`, `getOrganizationForUser`, `listProjects`, `listAgents`, `listApiKeys`, and `listTools` now return shallow plain objects. This fix is covered in the tests.

## Verification already completed

- `pnpm install --frozen-lockfile --store-dir /tmp/sentinel-pnpm-store`: lockfile current.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed after the SQLite serialization fix.
- `pnpm test`: passed, 24/24.
- Clean `pnpm --filter @sentinel/web build`: passed after the SQLite serialization fix, with `NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/tmp/sentinel-no-google-fonts.cjs` pointing to an empty mock. (A second clean build was run after that fix.)
- `git diff --check`: passed.
- A real Chromium browser verified local health endpoint, signup, dashboard rendering, tool registration, successful sample validation, rejection of `{ "query": 123 }` with `/query: must be string`, and display that the validator does not execute tools. The smoke script then stalled on a Playwright locator while attempting to edit the risk/status fields. This is unresolved **test harness navigation/locator behavior**, not evidence of a product failure. Resume the browser check, inspect/fix the locator, and verify editing, disable/re-enable, persistence after reload, organization isolation, and mobile overflow. The script is at `/tmp/sentinel-browser-check/smoke.cjs` if the temp directory persists; regenerate it if not.
- The test app used port 3101 and a temporary SQLite directory at `/tmp/sentinel-phase3-smoke-70GaXE`; its processes were stopped at handoff. Do not treat that test data as a user database.

For local reruns in the current macOS environment, Node is available at `/tmp/node-v22.23.3-darwin-arm64/bin/node` and pnpm 10.27.0 was bootstrapped via Corepack. Add that directory to `PATH`. Since `node_modules` currently links to `/tmp/sentinel-pnpm-store/v10`, pass `--store-dir /tmp/sentinel-pnpm-store` to pnpm install/add. CI's frozen-lockfile command needs no special store setting.

## Next session

1. Review `git status --short` and retain the user's in-progress landing-page/marketing changes.
2. Finish or replace the browser smoke script; build/test changes only if it reveals a problem.
3. Re-run `pnpm lint`, `pnpm test`, `pnpm typecheck`, and `pnpm --filter @sentinel/web build` after any edits.
4. Keep work on the current branch. The user did not ask to commit or push; leave both for an explicit follow-up.
5. Product roadmap status: Phases 0–3 are implemented locally; next planned work is Phase 4 gateway execution. Worker/D1 deployment, policy enforcement, and approval flows remain unimplemented.
