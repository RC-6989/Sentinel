const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(tmpdir(), 'sentinel-agents-'));
process.env.SENTINEL_DATA_DIR = dir;
const { getDb, hashToken } = require('../.test-build/db.js');
const { createOrganization, listProjects, listOrganizationsForUser, getOrganizationForUser } = require('../.test-build/orgs.js');
const { createAgent, updateAgent, listAgents, listApiKeys, issueApiKey, revokeApiKey, authenticateApiKey, AgentInputError } = require('../.test-build/agents.js');
const db = getDb();
for (const id of ['owner', 'other', 'member', 'admin']) {
  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(id, `${id}@example.test`, 'unused', id);
}
const org = createOrganization('owner', 'First');
const other = createOrganization('other', 'Second');
const project = listProjects(org.id)[0];
const otherProject = listProjects(other.id)[0];
for (const role of ['member', 'admin']) {
  db.prepare('INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)').run(role, org.id, role, role);
}
const agent = createAgent('owner', org.id, project.id, 'Test agent', 'Description');
const foreignAgent = createAgent('other', other.id, otherProject.id, 'Other agent', '');
after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('creates agent with project environment and permits member reads', () => {
  const [row] = listAgents('member', org.id);
  assert.equal(row.id, agent);
  assert.equal(row.environment, 'development');
  assert.equal(row.description, 'Description');
  // React rejects null-prototype SQLite rows as client component props.
  for (const record of [row, project, listOrganizationsForUser('owner')[0], getOrganizationForUser('owner', org.id)]) {
    assert.equal(Object.getPrototypeOf(record), Object.prototype);
  }
});

test('rejects cross-tenant reads, writes, keys, and project references', () => {
  for (const operation of [
    () => listAgents('other', org.id),
    () => listApiKeys('other', org.id),
    () => createAgent('other', org.id, project.id, 'Bad', ''),
    () => createAgent('owner', org.id, otherProject.id, 'Bad', ''),
    () => updateAgent('owner', org.id, foreignAgent, 'Bad', '', 'paused'),
    () => issueApiKey('owner', org.id, foreignAgent, 'Bad', 30),
  ]) assert.throws(operation, AgentInputError);
  assert.equal(listAgents('owner', org.id).length, 1);
});

test('members cannot mutate agents or keys; admins can', () => {
  const key = issueApiKey('admin', org.id, agent, 'Admin key', 7);
  for (const operation of [
    () => createAgent('member', org.id, project.id, 'Bad', ''),
    () => updateAgent('member', org.id, agent, 'Bad', '', 'paused'),
    () => issueApiKey('member', org.id, agent, 'Bad', 30),
    () => revokeApiKey('member', org.id, key.id),
  ]) assert.throws(operation, AgentInputError);
  revokeApiKey('admin', org.id, key.id);
});

test('keys authenticate only their bound identity and never appear in storage or lists', () => {
  const key = issueApiKey('owner', org.id, agent, 'Service', 30);
  assert.match(key.token, /^snt_[a-f0-9]{64}$/);
  assert.deepEqual({ ...authenticateApiKey(key.token) }, { keyId: key.id, organizationId: org.id, agentId: agent, projectId: project.id });
  const stored = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(key.id);
  assert.equal(stored.token_hash, hashToken(key.token));
  assert.ok(!JSON.stringify(stored).includes(key.token));
  assert.ok(!JSON.stringify(listApiKeys('owner', org.id)).includes(stored.token_hash));
  assert.equal(Object.getPrototypeOf(listApiKeys('owner', org.id)[0]), Object.prototype);
  assert.ok(!JSON.stringify(db.prepare('SELECT * FROM audit_logs').all()).includes(key.token));
  assert.equal(authenticateApiKey(`${key.token.slice(0, -1)}z`), null);
  assert.equal(authenticateApiKey('snt_' + '0'.repeat(64)), null);
  assert.equal(authenticateApiKey(''), null);
});

test('pause immediately rejects all keys; resume restores only valid keys', () => {
  const key = issueApiKey('owner', org.id, agent, 'Pause test', 7);
  const revoked = issueApiKey('owner', org.id, agent, 'Revoked', 7);
  revokeApiKey('owner', org.id, revoked.id);
  updateAgent('owner', org.id, agent, 'Renamed', 'Updated', 'paused');
  assert.equal(authenticateApiKey(key.token), null);
  assert.throws(() => issueApiKey('owner', org.id, agent, 'No', 7), AgentInputError);
  updateAgent('owner', org.id, agent, 'Renamed', 'Updated', 'active');
  assert.ok(authenticateApiKey(key.token));
  assert.equal(authenticateApiKey(revoked.token), null);
});

test('rotation revokes old key atomically and rejects foreign/revoked targets', () => {
  const old = issueApiKey('owner', org.id, agent, 'Old', 30);
  assert.throws(() => issueApiKey('other', other.id, foreignAgent, 'Bad', 30, old.id), AgentInputError);
  assert.ok(authenticateApiKey(old.token));
  const replacement = issueApiKey('owner', org.id, agent, 'Replacement', 30, old.id);
  assert.equal(authenticateApiKey(old.token), null);
  assert.ok(authenticateApiKey(replacement.token));
  assert.throws(() => issueApiKey('owner', org.id, agent, 'Again', 30, old.id), AgentInputError);
  assert.throws(() => revokeApiKey('other', other.id, replacement.id), AgentInputError);
  revokeApiKey('owner', org.id, replacement.id);
  revokeApiKey('owner', org.id, replacement.id);
  assert.equal(authenticateApiKey(replacement.token), null);
});

test('expired keys fail closed', () => {
  const key = issueApiKey('owner', org.id, agent, 'Expired', 7);
  db.prepare('UPDATE api_keys SET expires_at = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), key.id);
  assert.equal(authenticateApiKey(key.token), null);
});

test('validates inputs without partial mutations', () => {
  assert.throws(() => createAgent('owner', org.id, project.id, ' ', ''), AgentInputError);
  assert.throws(() => createAgent('owner', org.id, project.id, 'A', 'x'.repeat(501)), AgentInputError);
  assert.throws(() => updateAgent('owner', org.id, agent, 'A', '', 'invalid'), AgentInputError);
  for (const days of [0, 365, NaN]) assert.throws(() => issueApiKey('owner', org.id, agent, 'A', days), AgentInputError);
});

test('database rejects cross-tenant project and agent relationships', () => {
  assert.throws(() => db.prepare('INSERT INTO agents (id, organization_id, project_id, name) VALUES (?, ?, ?, ?)').run('bad', org.id, otherProject.id, 'Bad'), /FOREIGN KEY/);
  assert.throws(() => db.prepare('INSERT INTO api_keys (id, organization_id, agent_id, name, token_hash, token_prefix, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('bad', org.id, foreignAgent, 'Bad', 'hash', 'prefix', '2099-01-01'), /FOREIGN KEY/);
});

test('audit failure rolls back key rotation, preserving the old credential', () => {
  const old = issueApiKey('owner', org.id, agent, 'Rollback', 30);
  db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT, 'audit failed'); END");
  try {
    assert.throws(() => issueApiKey('owner', org.id, agent, 'Replacement', 30, old.id), /audit failed/);
    assert.ok(authenticateApiKey(old.token));
  } finally { db.exec('DROP TRIGGER fail_audit'); }
});
