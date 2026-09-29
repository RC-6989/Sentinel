const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');

global.crypto ??= require('node:crypto').webcrypto;
const { createD1Account, findD1Credential, createD1Session, getD1SessionUser, deleteD1Session } = require('../.test-build/account-store.js');

function testDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const name of ['0000_init.sql', '0001_saas_foundation.sql']) {
    sqlite.exec(readFileSync(join(__dirname, '../../migrations', name), 'utf8'));
  }
  function statement(sql, params = []) {
    return {
      sql, params,
      bind(...values) { return statement(sql, values); },
      async run() { return sqlite.prepare(sql).run(...params); },
      async first() { return sqlite.prepare(sql).get(...params) ?? null; },
    };
  }
  return {
    sqlite,
    binding: {
      prepare: statement,
      async batch(statements) {
        sqlite.exec('BEGIN');
        try {
          const results = statements.map(item => sqlite.prepare(item.sql).run(...item.params));
          sqlite.exec('COMMIT');
          return results;
        } catch (error) {
          sqlite.exec('ROLLBACK');
          throw error;
        }
      },
    },
  };
}

const sample = { name: 'Ari', email: ' ARI@EXAMPLE.COM ', passwordHash: 'scrypt$test$salted-hash', organizationName: 'Ari Labs' };

test('D1 account creation commits one usable workspace and detects duplicate email', async () => {
  const { sqlite, binding } = testDatabase();
  const result = await createD1Account(binding, sample);
  assert.equal(result.kind, 'created');
  assert.equal(result.user.email, 'ari@example.com');
  assert.equal(sqlite.prepare('SELECT role FROM organization_members WHERE user_id = ?').get(result.user.id).role, 'owner');
  assert.equal(sqlite.prepare('SELECT name FROM projects WHERE organization_id = ?').get(result.organizationId).name, 'Default');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM audit_logs WHERE actor_user_id = ?').get(result.user.id).n, 2);
  assert.equal((await findD1Credential(binding, 'ARI@example.com')).password_hash, sample.passwordHash);
  assert.deepEqual(await createD1Account(binding, { ...sample, email: 'ari@example.com' }), { kind: 'email_exists' });
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
  sqlite.close();
});

test('D1 account batch rolls back when a workspace write fails', async () => {
  const { sqlite, binding } = testDatabase();
  sqlite.exec("CREATE TRIGGER reject_project BEFORE INSERT ON projects BEGIN SELECT RAISE(ABORT, 'forced failure'); END");
  await assert.rejects(createD1Account(binding, sample));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM organizations').get().n, 0);
  sqlite.close();
});

test('D1 opaque sessions resolve, expire, and revoke without storing the raw token', async () => {
  const { sqlite, binding } = testDatabase();
  const account = await createD1Account(binding, sample);
  const { token } = await createD1Session(binding, account.user.id);
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.notEqual(sqlite.prepare('SELECT token_hash FROM sessions').get().token_hash, token);
  assert.equal((await getD1SessionUser(binding, token)).id, account.user.id);
  assert.equal(await getD1SessionUser(binding, 'invalid'), null);
  await deleteD1Session(binding, token);
  assert.equal(await getD1SessionUser(binding, token), null);
  const second = await createD1Session(binding, account.user.id);
  sqlite.prepare("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z'").run();
  assert.equal(await getD1SessionUser(binding, second.token), null);
  sqlite.close();
});
