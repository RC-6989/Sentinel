const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(tmpdir(), 'sentinel-waitlist-'));
process.env.SENTINEL_DATA_DIR = dir;
delete process.env.WAITLIST_WEBHOOK_URL;
delete process.env.VERCEL;
const { getDb } = require('../.test-build/db.js');
const { joinWaitlist } = require('../.test-build/waitlist.js');
const db = getDb();
after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('waitlist rejects invalid email and persists normalized signups only once', async () => {
  assert.equal((await joinWaitlist('invalid')).ok, false);
  assert.equal((await joinWaitlist(' Frontend@example.test ')).ok, true);
  assert.equal((await joinWaitlist('frontend@example.test')).ok, true);
  const row = db.prepare('SELECT COUNT(*) AS count, email FROM waitlist_signups').get();
  assert.equal(row.count, 1);
  assert.equal(row.email, 'frontend@example.test');
});

test('waitlist does not report success when a database insert fails', async () => {
  db.exec("CREATE TRIGGER fail_waitlist BEFORE INSERT ON waitlist_signups BEGIN SELECT RAISE(ABORT, 'storage unavailable'); END;");
  try {
    assert.deepEqual(await joinWaitlist('failure@example.test'), { ok: false, error: 'Could not save your email. Try again.' });
  } finally {
    db.exec('DROP TRIGGER fail_waitlist');
  }
});

test('unconfigured hosted waitlist returns a visitor-facing error', async () => {
  process.env.VERCEL = '1';
  try {
    assert.deepEqual(await joinWaitlist('hosted@example.test'), { ok: false, error: 'The waitlist is temporarily unavailable. Please try again later.' });
  } finally {
    delete process.env.VERCEL;
  }
});

test('webhook rejection and network failure never show a successful signup', async () => {
  const originalFetch = global.fetch;
  process.env.WAITLIST_WEBHOOK_URL = 'https://waitlist.example.test';
  try {
    global.fetch = async () => ({ ok: false });
    assert.equal((await joinWaitlist('webhook@example.test')).ok, false);
    global.fetch = async () => { throw new Error('offline'); };
    assert.equal((await joinWaitlist('offline@example.test')).ok, false);
  } finally {
    global.fetch = originalFetch;
    delete process.env.WAITLIST_WEBHOOK_URL;
  }
});
