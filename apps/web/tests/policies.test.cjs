const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(tmpdir(), 'sentinel-policies-'));
process.env.SENTINEL_DATA_DIR = dir;
const { getDb } = require('../.test-build/db.js');
const { createOrganization, createProject, listProjects } = require('../.test-build/orgs.js');
const { createAgent } = require('../.test-build/agents.js');
const { createTool } = require('../.test-build/tools.js');
const { createPolicy, updatePolicy, listPolicies, evaluateProjectPolicy, PolicyInputError } = require('../.test-build/policies.js');
const db = getDb();
for (const id of ['owner', 'member', 'other']) db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
  .run(id, `${id}@example.test`, 'unused', id);
const org = createOrganization('owner', 'Policy org');
const otherOrg = createOrganization('other', 'Other policy org');
db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ('member-row', ?, 'member', 'member')").run(org.id);
const project = listProjects(org.id)[0];
const secondProject = createProject(org.id, 'owner', 'Production', 'production');
const otherProject = listProjects(otherOrg.id)[0];
const agent = createAgent('owner', org.id, project.id, 'Policy agent', '');
const tool = createTool('owner', org.id, project.id, { name: 'Policy tool', description: '', riskLevel: 'low', inputSchema: '{"type":"object"}' });
const context = { agentId: agent, toolId: tool, riskLevel: 'low', arguments: { query: 'allowed' } };
after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('owner can create a project policy; member can read but cannot write', () => {
  const id = createPolicy('owner', org.id, project.id, 'Allow lookup', JSON.stringify([
    { id: 'allow', effect: 'allow', toolId: tool, agentId: agent, environment: 'development' },
  ]));
  assert.equal(listPolicies('member', org.id).find(policy => policy.id === id).project_id, project.id);
  assert.equal(evaluateProjectPolicy(org.id, project.id, context).decision, 'allow');
  assert.throws(() => createPolicy('member', org.id, project.id, 'No', '[{"id":"x","effect":"allow"}]'), PolicyInputError);
  assert.throws(() => updatePolicy('member', org.id, id, 'No', '[{"id":"x","effect":"allow"}]', 'active'), PolicyInputError);
  assert.throws(() => listPolicies('other', org.id), PolicyInputError);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'policy.created' AND resource_id = ?").get(id).count, 1);
});

test('policy references cannot cross project or organization boundaries', () => {
  for (const [organizationId, projectId, rules] of [
    [org.id, secondProject.id, [{ id: 'wrong-tool', effect: 'allow', toolId: tool }]],
    [otherOrg.id, otherProject.id, [{ id: 'wrong-agent', effect: 'allow', agentId: agent }]],
  ]) assert.throws(() => createPolicy(organizationId === org.id ? 'owner' : 'other', organizationId, projectId,
    'Cross scope', JSON.stringify(rules)), PolicyInputError);
  assert.throws(() => createPolicy('owner', org.id, otherProject.id, 'Cross org', '[{"id":"x","effect":"allow"}]'), PolicyInputError);
  assert.equal(evaluateProjectPolicy(org.id, secondProject.id, context).decision, 'deny');
});

test('disabled policy stops dispatch; project environment is read from storage', () => {
  const id = createPolicy('owner', org.id, secondProject.id, 'Production only', JSON.stringify([
    { id: 'prod', effect: 'allow', environment: 'production' },
  ]));
  assert.equal(evaluateProjectPolicy(org.id, secondProject.id, context).decision, 'allow');
  updatePolicy('owner', org.id, id, 'Production only', '[{"id":"prod","effect":"allow","environment":"production"}]', 'disabled');
  assert.equal(evaluateProjectPolicy(org.id, secondProject.id, context).decision, 'deny');
  assert.throws(() => updatePolicy('owner', otherOrg.id, id, 'No', '[{"id":"x","effect":"allow"}]', 'active'), PolicyInputError);
});

test('invalid rule and audit failure leave no policy or partial edit', () => {
  assert.throws(() => createPolicy('owner', org.id, project.id, 'Invalid', '[{"id":"x","effect":"maybe"}]'), PolicyInputError);
  const count = db.prepare('SELECT COUNT(*) AS count FROM policies').get().count;
  db.exec("CREATE TRIGGER fail_policy_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT, 'audit failed'); END");
  try {
    assert.throws(() => createPolicy('owner', org.id, project.id, 'Rollback', '[{"id":"x","effect":"allow"}]'), /audit failed/);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM policies').get().count, count);
  } finally { db.exec('DROP TRIGGER fail_policy_audit'); }
});
