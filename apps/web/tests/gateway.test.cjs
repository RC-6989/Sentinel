const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(tmpdir(), 'sentinel-gateway-'));
process.env.SENTINEL_DATA_DIR = dir;
process.env.SENTINEL_ALLOWED_TOOL_ORIGINS = 'https://tools.example.test';
const { getDb } = require('../.test-build/db.js');
const { createOrganization, createProject, listProjects } = require('../.test-build/orgs.js');
const { createAgent, issueApiKey, revokeApiKey, updateAgent } = require('../.test-build/agents.js');
const { createTool, updateTool, ToolInputError } = require('../.test-build/tools.js');
const { executeToolCall, GatewayError } = require('../.test-build/gateway.js');
const { createPolicy, updatePolicy, countBlockedCalls } = require('../.test-build/policies.js');
const { parseToolTarget } = require('../.test-build/tool-target.js');
const db = getDb();
for (const id of ['owner', 'other']) db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(id, `${id}@example.test`, 'unused', id);
const org = createOrganization('owner', 'Gateway');
const other = createOrganization('other', 'Other gateway');
const project = listProjects(org.id)[0];
const secondProject = createProject(org.id, 'owner', 'Second project');
const otherProject = listProjects(other.id)[0];
const agent = createAgent('owner', org.id, project.id, 'Gateway agent', '');
const secondAgent = createAgent('owner', org.id, secondProject.id, 'Second agent', '');
const foreignAgent = createAgent('other', other.id, otherProject.id, 'Foreign agent', '');
const key = issueApiKey('owner', org.id, agent, 'Gateway key', 7);
const secondKey = issueApiKey('owner', org.id, secondAgent, 'Second key', 7);
const foreignKey = issueApiKey('other', other.id, foreignAgent, 'Foreign key', 7);
const schema = JSON.stringify({ type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false });
const definition = { name: 'Lookup', description: '', riskLevel: 'low', inputSchema: schema, targetUrl: 'https://tools.example.test/lookup', executionEnabled: true };
const tool = createTool('owner', org.id, project.id, definition);
const allowPolicy = createPolicy('owner', org.id, project.id, 'Gateway allow', JSON.stringify([{ id: 'allow-project', effect: 'allow' }]));
const off = createTool('owner', org.id, project.id, { ...definition, name: 'Off', executionEnabled: false });
const foreignTool = createTool('other', other.id, otherProject.id, definition);
const calls = [];
async function target(url, init) {
  calls.push({ url: String(url), init });
  return Response.json({ received: JSON.parse(init.body) });
}
function assertGateway(status, code) {
  return error => error instanceof GatewayError && error.status === status && error.code === code;
}
after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('dispatches validated JSON only to the configured target and records metadata', async () => {
  const result = await executeToolCall(key.token, tool, 'first-call', '{"query":"hello"}', target);
  assert.equal(result.requestId, 'first-call');
  assert.deepEqual(result.result, { received: { query: 'hello' } });
  assert.match(result.callId, /^cal_/);
  assert.equal(calls[0].url, definition.targetUrl);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.redirect, 'manual');
  assert.equal(calls[0].init.headers['Idempotency-Key'], 'first-call');
  assert.equal(calls[0].init.headers.Authorization, undefined);
  const saved = db.prepare('SELECT * FROM tool_calls WHERE id = ?').get(result.callId);
  assert.equal(saved.status, 'succeeded');
  assert.equal(saved.target_status, 200);
  assert.equal(saved.organization_id, org.id);
  assert.equal(saved.project_id, project.id);
  assert.equal(saved.agent_id, agent);
  assert.equal(saved.api_key_id, key.id);
  assert.equal(saved.policy_rule_id, `${allowPolicy}:allow-project`);
  assert.ok(!JSON.stringify(saved).includes(key.token));
  assert.ok(!JSON.stringify(saved).includes('hello'));
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_logs WHERE action = ? AND resource_id = ?').get('tool.call_started', result.callId).count, 1);
});

test('fails closed for inactive keys, other projects, other tenants and disabled tools', async () => {
  const before = calls.length;
  for (const [token, toolId, status, code] of [
    ['bad', tool, 401, 'unauthorized'],
    [secondKey.token, tool, 404, 'tool_not_found'],
    [foreignKey.token, tool, 404, 'tool_not_found'],
    [key.token, foreignTool, 404, 'tool_not_found'],
    [key.token, off, 409, 'tool_unavailable'],
  ]) await assert.rejects(executeToolCall(token, toolId, `denied-${before}-${status}-${toolId}`, '{"query":"ok"}', target), assertGateway(status, code));
  assert.equal(calls.length, before);
  const expired = issueApiKey('owner', org.id, agent, 'Expired', 7);
  db.prepare('UPDATE api_keys SET expires_at = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), expired.id);
  await assert.rejects(executeToolCall(expired.token, tool, 'expired', '{"query":"ok"}', target), assertGateway(401, 'unauthorized'));
  updateAgent('owner', org.id, agent, 'Gateway agent', '', 'paused');
  await assert.rejects(executeToolCall(key.token, tool, 'paused', '{"query":"ok"}', target), assertGateway(401, 'unauthorized'));
  updateAgent('owner', org.id, agent, 'Gateway agent', '', 'active');
});

test('rejects invalid JSON/schema and request IDs before dispatch', async () => {
  const before = calls.length;
  for (const input of ['{', '{}', '{"query":12}', '{"query":"ok","extra":true}', 'null', ' '.repeat(65537)]) {
    await assert.rejects(executeToolCall(key.token, tool, `bad-input-${input.length}`, input, target), assertGateway(400, 'invalid_input'));
  }
  for (const requestId of ['', '../x', 'x'.repeat(129)]) {
    await assert.rejects(executeToolCall(key.token, tool, requestId, '{"query":"ok"}', target), assertGateway(400, 'invalid_request_id'));
  }
  assert.equal(calls.length, before);
});

test('normalizes duplicate JSON keys before forwarding validated input', async () => {
  const result = await executeToolCall(key.token, tool, 'duplicate-json-keys', '{"query":2,"query":"last"}', target);
  assert.deepEqual(result.result, { received: { query: 'last' } });
  assert.equal(calls.at(-1).init.body, '{"query":"last"}');
});

test('reserves an idempotency key before dispatch and never repeats it', async () => {
  let release;
  const pending = executeToolCall(key.token, tool, 'one-action', '{"query":"ok"}', () => new Promise(resolve => { release = resolve; }));
  assert.equal(typeof release, 'function');
  await assert.rejects(executeToolCall(key.token, tool, 'one-action', '{"query":"different"}', target), assertGateway(409, 'duplicate_request'));
  release(Response.json({ ok: true }));
  await pending;
  await assert.rejects(executeToolCall(key.token, tool, 'one-action', '{"query":"ok"}', target), assertGateway(409, 'duplicate_request'));
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM tool_calls WHERE request_id = 'one-action'").get().count, 1);
});

test('target errors, redirects, oversized responses and network failures are recorded without a retry', async () => {
  const cases = [
    ['upstream-error', async () => Response.json({ error: 'private' }, { status: 500 }), 'target_failed'],
    ['redirect', async () => new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example/' } }), 'target_failed'],
    ['invalid-json', async () => new Response('not-json', { headers: { 'Content-Type': 'application/json' } }), 'invalid_target_response'],
    ['oversized', async () => Response.json({ data: 'x'.repeat(65536) }), 'target_response_too_large'],
    ['network-error', async () => { throw new Error('private endpoint detail'); }, 'target_unreachable'],
  ];
  for (const [requestId, transport, code] of cases) {
    await assert.rejects(executeToolCall(key.token, tool, requestId, '{"query":"ok"}', transport), assertGateway(502, code));
    const row = db.prepare('SELECT status, failure_code FROM tool_calls WHERE request_id = ?').get(requestId);
    assert.equal(row.status, 'failed');
    assert.equal(row.failure_code, code);
    await assert.rejects(executeToolCall(key.token, tool, requestId, '{"query":"ok"}', target), assertGateway(409, 'duplicate_request'));
  }
});

test('execution requires operator allowlisting, HTTPS, and low/medium risk opt-in', async () => {
  const before = calls.length;
  for (const targetUrl of ['http://169.254.169.254/latest', 'file:///etc/passwd', 'https://user:pass@tools.example.test/lookup', 'https://tools.example.test/lookup?secret=x']) {
    assert.throws(() => createTool('owner', org.id, project.id, { ...definition, name: `Bad ${targetUrl}`, targetUrl }), ToolInputError);
  }
  assert.throws(() => createTool('owner', org.id, project.id, { ...definition, name: 'Unknown origin', targetUrl: 'https://other.example.test/' }), /allowlist/);
  assert.throws(() => createTool('owner', org.id, project.id, { ...definition, name: 'No target', targetUrl: '' }), /target URL/);
  for (const riskLevel of ['high', 'critical']) {
    assert.throws(() => createTool('owner', org.id, project.id, { ...definition, name: `Risk ${riskLevel}`, riskLevel }), /approval workflow/);
  }
  const prior = process.env.SENTINEL_ALLOWED_TOOL_ORIGINS;
  process.env.SENTINEL_ALLOWED_TOOL_ORIGINS = '';
  try { await assert.rejects(executeToolCall(key.token, tool, 'allowlist-removed', '{"query":"ok"}', target), assertGateway(503, 'target_not_allowed')); }
  finally { process.env.SENTINEL_ALLOWED_TOOL_ORIGINS = prior; }
  assert.equal(calls.length, before);
  process.env.SENTINEL_GLOBAL_KILL_SWITCH = 'true';
  try { await assert.rejects(executeToolCall(key.token, tool, 'kill-switched', '{"query":"ok"}', target), assertGateway(503, 'execution_disabled')); }
  finally { delete process.env.SENTINEL_GLOBAL_KILL_SWITCH; }
  assert.equal(calls.length, before);
});

test('explicit local loopback exception does not allow other HTTP hosts', () => {
  const prior = process.env.SENTINEL_ALLOWED_TOOL_ORIGINS;
  process.env.SENTINEL_ALLOWED_TOOL_ORIGINS = 'http://127.0.0.1:4141';
  try {
    assert.throws(() => parseToolTarget('http://127.0.0.1:4141/execute'), ToolInputError);
    process.env.SENTINEL_ALLOW_INSECURE_LOOPBACK_TOOLS = 'true';
    assert.equal(parseToolTarget('http://127.0.0.1:4141/execute').origin, 'http://127.0.0.1:4141');
    assert.throws(() => parseToolTarget('http://127.0.0.1.evil.example:4141/execute'), ToolInputError);
    assert.throws(() => parseToolTarget('http://169.254.169.254/'), ToolInputError);
    process.env.SENTINEL_ALLOWED_TOOL_ORIGINS = 'https://169.254.169.254';
    assert.throws(() => parseToolTarget('https://169.254.169.254/'), ToolInputError);
  } finally {
    process.env.SENTINEL_ALLOWED_TOOL_ORIGINS = prior;
    delete process.env.SENTINEL_ALLOW_INSECURE_LOOPBACK_TOOLS;
  }
});

test('disabling a tool stops execution immediately', async () => {
  const before = calls.length;
  updateTool('owner', org.id, tool, definition, 'disabled');
  try { await assert.rejects(executeToolCall(key.token, tool, 'disabled-after-create', '{"query":"ok"}', target), assertGateway(409, 'tool_unavailable')); }
  finally { updateTool('owner', org.id, tool, definition, 'active'); }
  assert.equal(calls.length, before);
});

test('an audit failure prevents dispatch and rolls back the call reservation', async () => {
  const before = calls.length;
  db.exec("CREATE TRIGGER fail_gateway_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT, 'audit failed'); END");
  try {
    await assert.rejects(executeToolCall(key.token, tool, 'audit-failed', '{"query":"ok"}', target), /audit failed/);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM tool_calls WHERE request_id = 'audit-failed'").get().count, 0);
    assert.equal(calls.length, before);
  } finally { db.exec('DROP TRIGGER fail_gateway_audit'); }
});

test('revoke during a pending target call withholds its result', async () => {
  const temporary = issueApiKey('owner', org.id, agent, 'Revoke in flight', 7);
  const result = executeToolCall(temporary.token, tool, 'revoke-in-flight', '{"query":"ok"}', async () => {
    revokeApiKey('owner', org.id, temporary.id);
    return Response.json({ private: true });
  });
  await assert.rejects(result, assertGateway(401, 'unauthorized'));
  assert.equal(db.prepare("SELECT status FROM tool_calls WHERE request_id = 'revoke-in-flight'").get().status, 'succeeded');
});

test('no policy, explicit deny, and approval hold calls before outbound dispatch', async () => {
  const before = calls.length;
  const allow = JSON.stringify([{ id: 'allow-project', effect: 'allow' }]);
  updatePolicy('owner', org.id, allowPolicy, 'Gateway allow', allow, 'disabled');
  try {
    await assert.rejects(executeToolCall(key.token, tool, 'no-policy', '{"query":"ok"}', target), assertGateway(403, 'policy_denied'));
    const decisionPolicy = createPolicy('owner', org.id, project.id, 'Decision test', JSON.stringify([
      { id: 'allow', effect: 'allow' },
      { id: 'review', effect: 'approval', argument: { path: '/query', operator: 'equals', value: 'review' } },
      { id: 'deny', effect: 'deny', argument: { path: '/query', operator: 'equals', value: 'private' } },
    ]));
    try {
      await assert.rejects(executeToolCall(key.token, tool, 'review', '{"query":"review"}', target), assertGateway(409, 'approval_required'));
      await assert.rejects(executeToolCall(key.token, tool, 'private', '{"query":"private"}', target), assertGateway(403, 'policy_denied'));
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM tool_calls WHERE request_id IN ('no-policy', 'review', 'private')").get().count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action IN ('tool.call_denied', 'tool.call_approval_required')").get().count >= 3, true);
      assert.equal(countBlockedCalls('owner', org.id) >= 3, true);
    } finally {
      updatePolicy('owner', org.id, decisionPolicy, 'Decision test', JSON.stringify([{ id: 'deny', effect: 'deny' }]), 'disabled');
    }
  } finally { updatePolicy('owner', org.id, allowPolicy, 'Gateway allow', allow, 'active'); }
  assert.equal(calls.length, before);
});

test('corrupted active policy fails closed instead of silently allowing', async () => {
  const before = calls.length;
  db.prepare('UPDATE policies SET rules_json = ? WHERE id = ?').run(JSON.stringify([{ id: 'broken', effect: 'permit' }]), allowPolicy);
  try { await assert.rejects(executeToolCall(key.token, tool, 'bad-stored-policy', '{"query":"ok"}', target), assertGateway(503, 'policy_invalid')); }
  finally { db.prepare('UPDATE policies SET rules_json = ? WHERE id = ?').run(JSON.stringify([{ id: 'allow-project', effect: 'allow' }]), allowPolicy); }
  assert.equal(calls.length, before);
});

test('per-key daily quota stops the 101st dispatch', async () => {
  const quotaKey = issueApiKey('owner', org.id, agent, 'Quota', 7);
  let sent = 0;
  const fastTarget = async () => { sent++; return Response.json({ ok: true }); };
  for (let i = 0; i < 100; i++) await executeToolCall(quotaKey.token, tool, `quota-${i}`, '{"query":"ok"}', fastTarget);
  await assert.rejects(executeToolCall(quotaKey.token, tool, 'quota-100', '{"query":"ok"}', fastTarget), assertGateway(429, 'daily_limit'));
  assert.equal(sent, 100);
});

test('organization daily quota spans keys and stops outbound dispatch', async () => {
  const orgKey = issueApiKey('owner', org.id, agent, 'Organization quota', 7);
  const existing = db.prepare('SELECT COUNT(*) AS count FROM tool_calls WHERE organization_id = ? AND created_at >= ?')
    .get(org.id, new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()).count;
  const insert = db.prepare(`INSERT INTO tool_calls
    (id, organization_id, project_id, agent_id, api_key_id, tool_id, request_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`);
  db.exec('BEGIN');
  try {
    for (let i = existing; i < 1000; i++) insert.run(`fill_${i}`, org.id, project.id, agent, key.id, tool, `org-quota-${i}`, new Date().toISOString());
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  const before = calls.length;
  await assert.rejects(executeToolCall(orgKey.token, tool, 'org-quota-over', '{"query":"ok"}', target), assertGateway(429, 'organization_daily_limit'));
  assert.equal(calls.length, before);
});

test('daily blocked-decision cap prevents unbounded audit writes', async () => {
  const prior = db.prepare(`SELECT COUNT(*) AS count FROM audit_logs WHERE organization_id = ?
    AND action IN ('tool.call_denied', 'tool.call_approval_required') AND created_at >= ?`)
    .get(org.id, new Date().toISOString().slice(0, 10) + ' 00:00:00').count;
  const insert = db.prepare("INSERT INTO audit_logs (id, organization_id, action) VALUES (?, ?, 'tool.call_denied')");
  db.exec('BEGIN');
  try {
    for (let i = prior; i < 1000; i++) insert.run(`block-fill-${i}`, org.id);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  updatePolicy('owner', org.id, allowPolicy, 'Gateway allow', '[{"id":"allow-project","effect":"allow"}]', 'disabled');
  const auditCount = db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count;
  const before = calls.length;
  try {
    await assert.rejects(executeToolCall(key.token, tool, 'blocked-over-limit', '{"query":"ok"}', target), assertGateway(429, 'policy_decision_limit'));
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count, auditCount);
  }
  finally { updatePolicy('owner', org.id, allowPolicy, 'Gateway allow', '[{"id":"allow-project","effect":"allow"}]', 'active'); }
  assert.equal(calls.length, before);
});
