-- Sentinel D1 migrations
-- Phase 1+ will add schema for organizations, agents, tools, policies, etc.
-- Apply with Wrangler after Cloudflare account setup (manual).

-- Placeholder: schema version table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0000_init');
