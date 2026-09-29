const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

process.env.SENTINEL_DATA_DIR = mkdtempSync(join(tmpdir(), 'sentinel-registration-'));
const { registerAccount } = require('../.test-build/account-registration.js');
const { getDb } = require('../.test-build/db.js');
const { dashboardEnabled } = require('../.test-build/deployment.js');

const db = getDb();
const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;

test('signup creates a user, owner membership, project, and audit together', () => {
  const result = registerAccount({ name: 'Riley', email: ' Riley@Example.com ', password: 'correct horse battery', organizationName: 'Acme' });
  assert.equal(result.kind, 'created');
  assert.equal(db.prepare('SELECT email FROM users WHERE id = ?').get(result.userId).email, 'riley@example.com');
  assert.equal(db.prepare('SELECT role FROM organization_members WHERE user_id = ?').get(result.userId).role, 'owner');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM projects WHERE organization_id = (SELECT organization_id FROM organization_members WHERE user_id = ?)').get(result.userId).count, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE actor_user_id = ? AND action = 'user.signup'").get(result.userId).count, 1);
  assert.deepEqual(registerAccount({ name: 'Duplicate', email: 'RILEY@example.com', password: 'different password', organizationName: 'Other' }), { kind: 'email_exists' });
  assert.equal(count('users'), 1);
});

test('failed workspace creation rolls back the user and leaves signup usable', () => {
  db.exec("CREATE TRIGGER reject_org BEFORE INSERT ON organizations BEGIN SELECT RAISE(ABORT, 'forced failure'); END");
  assert.throws(() => registerAccount({ name: 'Failed', email: 'failed@example.com', password: 'valid password', organizationName: 'Broken' }));
  assert.equal(count('users'), 1);
  assert.equal(count('organizations'), 1);
  db.exec('DROP TRIGGER reject_org');
  assert.equal(registerAccount({ name: 'Recovered', email: 'failed@example.com', password: 'valid password', organizationName: 'Recovered' }).kind, 'created');
});

test('production account routes require explicit durable storage and a real secret', () => {
  const base = { NODE_ENV: 'production', SENTINEL_WAITLIST_MODE: 'false', SENTINEL_DATA_DIR: '/mounted/sentinel', SENTINEL_PERSISTENT_STORAGE_CONFIRMED: 'true', AUTH_SECRET: 'a'.repeat(48) };
  assert.equal(dashboardEnabled(base), true);
  assert.equal(dashboardEnabled({ ...base, SENTINEL_DATA_DIR: '' }), false);
  assert.equal(dashboardEnabled({ ...base, SENTINEL_DATA_DIR: '.data' }), false);
  assert.equal(dashboardEnabled({ ...base, SENTINEL_PERSISTENT_STORAGE_CONFIRMED: 'false' }), false);
  assert.equal(dashboardEnabled({ ...base, AUTH_SECRET: 'local-dev-only-sentinel-auth-secret-change-me' }), false);
  assert.equal(dashboardEnabled({ ...base, SENTINEL_WAITLIST_MODE: undefined }), false);
  assert.equal(dashboardEnabled({ NODE_ENV: 'development' }), true);
  assert.equal(dashboardEnabled({ NODE_ENV: 'development', SENTINEL_WAITLIST_MODE: 'true' }), false);
});
