-- Phase 5: project-scoped deterministic policy sets. Existing tools have no
-- implicit allow; the gateway denies until an active policy matches.
CREATE TABLE policies (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 80),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  rules_json TEXT NOT NULL CHECK (json_valid(rules_json)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, project_id, name),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id)
);
CREATE INDEX idx_policies_project ON policies(organization_id, project_id, status);

-- Allowed dispatches retain the policy rule that authorized them. Blocked
-- attempts are written to audit_logs without storing input or response data.
ALTER TABLE tool_calls ADD COLUMN policy_rule_id TEXT;
