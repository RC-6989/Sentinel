-- Execution is opt-in per tool. Existing registrations remain unconfigured.
ALTER TABLE tools ADD COLUMN target_url TEXT;
ALTER TABLE tools ADD COLUMN execution_enabled INTEGER NOT NULL DEFAULT 0
  CHECK (execution_enabled IN (0, 1));

-- A request ID is reserved before dispatch. Retrying it cannot repeat a call.
-- No input, response, API key, or target credentials are stored here.
CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  api_key_id TEXT NOT NULL REFERENCES api_keys(id),
  tool_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  target_status INTEGER,
  failure_code TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT,
  UNIQUE (organization_id, agent_id, request_id),
  FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id),
  FOREIGN KEY (organization_id, agent_id) REFERENCES agents(organization_id, id),
  FOREIGN KEY (organization_id, tool_id) REFERENCES tools(organization_id, id)
);
CREATE INDEX idx_tool_calls_key_created ON tool_calls(api_key_id, created_at);
CREATE INDEX idx_tool_calls_org_created ON tool_calls(organization_id, created_at);
