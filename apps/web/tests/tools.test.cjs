const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(tmpdir(), 'sentinel-tools-'));
process.env.SENTINEL_DATA_DIR = dir;
const { getDb } = require('../.test-build/db.js');
const { createOrganization, createProject, listProjects } = require('../.test-build/orgs.js');
const { createTool, updateTool, listTools, testToolInput, ToolInputError } = require('../.test-build/tools.js');
const { normalizeToolSchema, validateToolInput } = require('../.test-build/tool-schema.js');
const db = getDb();
for (const id of ['owner', 'other', 'member', 'admin']) {
  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(id, `${id}@example.test`, 'unused', id);
}
const org = createOrganization('owner', 'Tools');
const other = createOrganization('other', 'Other tools');
const project = listProjects(org.id)[0];
const otherProject = listProjects(other.id)[0];
for (const role of ['member', 'admin']) {
  db.prepare('INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)').run(role, org.id, role, role);
}
const schema = {
  type: 'object', properties: {
    query: { type: 'string', minLength: 1, maxLength: 200 },
    limit: { type: 'integer', minimum: 1, maximum: 10 },
  }, required: ['query'], additionalProperties: false,
};
const details = { name: 'Search', description: 'Find documents', riskLevel: 'low', inputSchema: JSON.stringify(schema) };
const tool = createTool('owner', org.id, project.id, details);
const foreignTool = createTool('other', other.id, otherProject.id, details);
after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

test('registers and persists a tool with project environment, risk and schema', () => {
  const [row] = listTools('member', org.id);
  assert.equal(row.id, tool);
  assert.equal(row.environment, 'development');
  assert.equal(row.risk_level, 'low');
  assert.equal(row.status, 'active');
  assert.equal(Object.getPrototypeOf(row), Object.prototype);
  assert.deepEqual(JSON.parse(row.input_schema_json), schema);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_logs WHERE action = ? AND resource_id = ?').get('tool.created', tool).n, 1);
});

test('rejects cross-tenant reads, writes, validation and project references', () => {
  for (const operation of [
    () => listTools('other', org.id),
    () => createTool('other', org.id, project.id, details),
    () => createTool('owner', org.id, otherProject.id, details),
    () => updateTool('owner', org.id, foreignTool, details, 'disabled'),
    () => testToolInput('other', org.id, tool, '{}'),
    () => testToolInput('owner', org.id, foreignTool, '{}'),
  ]) assert.throws(operation, ToolInputError);
});

test('members can validate but cannot mutate tools; admins can manage tools', () => {
  assert.equal(testToolInput('member', org.id, tool, '{"query":"hello"}').valid, true);
  assert.throws(() => createTool('member', org.id, project.id, details), ToolInputError);
  assert.throws(() => updateTool('member', org.id, tool, details, 'disabled'), ToolInputError);
  const id = createTool('admin', org.id, project.id, { ...details, name: 'Admin tool' });
  updateTool('admin', org.id, id, { ...details, name: 'Admin edited', riskLevel: 'high' }, 'disabled');
  const row = listTools('owner', org.id).find(t => t.id === id);
  assert.equal(row.name, 'Admin edited');
  assert.equal(row.risk_level, 'high');
  assert.equal(row.status, 'disabled');
  assert.equal(row.project_id, project.id);
  assert.equal(testToolInput('member', org.id, id, '{"query":"hello"}').valid, true);
  updateTool('admin', org.id, id, { ...details, name: 'Admin edited' }, 'active');
  assert.equal(listTools('owner', org.id).find(t => t.id === id).status, 'active');
});

test('names are unique within a project, case-insensitively', () => {
  assert.throws(() => createTool('owner', org.id, project.id, { ...details, name: ' search ' }), /already exists/);
  const second = createProject(org.id, 'owner', 'Second project', 'staging');
  const id = createTool('owner', org.id, second.id, details);
  assert.equal(listTools('owner', org.id).find(t => t.id === id).environment, 'staging');
});

test('schema validation rejects missing, additional and incorrectly typed input without coercion', () => {
  for (const input of [{}, { query: '' }, { query: 'a', limit: '2' }, { query: 'a', limit: 11 }, { query: 'a', extra: true }, null, [], 'a']) {
    const result = testToolInput('owner', org.id, tool, JSON.stringify(input));
    assert.equal(result.valid, false);
    assert.ok(result.errors.length);
  }
  assert.deepEqual(testToolInput('owner', org.id, tool, '{"query":"a","limit":2}'), { valid: true, errors: [] });
});

test('supports nested objects, arrays, enums and numeric constraints', () => {
  const nested = JSON.stringify({ type: 'object', properties: {
    entries: { type: 'array', minItems: 1, maxItems: 2, items: {
      type: 'object', properties: { mode: { type: 'string', enum: ['read', 'write'] } }, required: ['mode'], additionalProperties: false,
    } },
  }, required: ['entries'], additionalProperties: false });
  assert.equal(validateToolInput(nested, '{"entries":[{"mode":"read"}]}').valid, true);
  assert.equal(validateToolInput(nested, '{"entries":[{"mode":"delete"}]}').valid, false);
  assert.equal(validateToolInput(nested, '{"entries":[]}').valid, false);
});

test('schema updates take effect immediately without stale validator reuse', () => {
  const id = createTool('owner', org.id, project.id, { ...details, name: 'Changing schema' });
  const updated = { ...details, name: 'Changing schema', inputSchema: '{"type":"object","properties":{"count":{"type":"integer"}},"required":["count"],"additionalProperties":false}' };
  updateTool('owner', org.id, id, updated, 'active');
  assert.equal(testToolInput('owner', org.id, id, '{"query":"old input"}').valid, false);
  assert.equal(testToolInput('owner', org.id, id, '{"count":2}').valid, true);
});

test('rejects invalid metadata and malformed schemas without partial writes', () => {
  const before = listTools('owner', org.id).length;
  for (const patch of [{ name: ' ' }, { description: 'x'.repeat(501) }, { riskLevel: 'unknown' }, { inputSchema: '{' }, { inputSchema: 'true' }, { inputSchema: '{"type":"string"}' }, { inputSchema: '{"type":"object","required":["missing"]}' }]) {
    assert.throws(() => createTool('owner', org.id, project.id, { ...details, name: 'Invalid', ...patch }), ToolInputError);
  }
  assert.throws(() => updateTool('owner', org.id, tool, details, 'unknown'), ToolInputError);
  assert.equal(listTools('owner', org.id).length, before);
});

test('rejects unsupported schema features at every schema level', () => {
  for (const keyword of ['$ref', '$async', '$id', 'pattern', 'format', 'allOf', 'oneOf', 'anyOf', 'not', 'patternProperties', 'uniqueItems', 'default', 'unknown']) {
    for (const definition of [
      { type: 'object', [keyword]: 'unsupported' },
      { type: 'object', properties: { value: { type: 'string', [keyword]: 'unsupported' } } },
    ]) assert.throws(() => normalizeToolSchema(JSON.stringify(definition)), /Unsupported schema keyword/);
  }
  // Data inside const/enum is data; property names are not schema keywords.
  assert.equal(validateToolInput('{"type":"object","properties":{"pattern":{"const":{"$ref":"literal"}}}}', '{"pattern":{"$ref":"literal"}}').valid, true);
  assert.throws(() => normalizeToolSchema('{"type":"object","$schema":"https://json-schema.org/draft/2020-12/schema"}'), /draft-07/);
});

test('caps schema and input sizes, depth and complexity', () => {
  assert.throws(() => normalizeToolSchema(JSON.stringify({ type: 'object', description: 'x'.repeat(16384) })), /16 KiB/);
  let deep = { type: 'string' };
  for (let i = 0; i < 9; i++) deep = { type: 'object', properties: { child: deep } };
  assert.throws(() => normalizeToolSchema(JSON.stringify(deep)), /too complex/);
  assert.throws(() => normalizeToolSchema(JSON.stringify({ type: 'object', properties: Object.fromEntries(Array.from({ length: 130 }, (_, i) => [`p${i}`, { type: 'string' }])) })), /too complex/);
  for (const input of ['{', ' '.repeat(65537), '{"n":1e999}', '['.repeat(22) + '0' + ']'.repeat(22), JSON.stringify(Array(4100).fill(0))]) {
    assert.throws(() => validateToolInput('{"type":"object"}', input), ToolInputError);
  }
});

test('rejects schema properties Ajv would silently ignore', () => {
  assert.throws(() => normalizeToolSchema('{"type":"object","properties":{"__proto__":{"type":"string"}}}'), /not supported/);
  for (const name of ['constructor', 'prototype']) {
    const definition = JSON.stringify({ type: 'object', properties: { [name]: { type: 'string' } } });
    assert.equal(validateToolInput(definition, JSON.stringify({ [name]: 123 })).valid, false);
  }
});

test('database rejects cross-tenant references and duplicate tool names', () => {
  const insert = db.prepare('INSERT INTO tools (id, organization_id, project_id, name, risk_level, input_schema_json) VALUES (?, ?, ?, ?, ?, ?)');
  assert.throws(() => insert.run('bad', org.id, otherProject.id, 'Bad', 'low', '{}'), /FOREIGN KEY/);
  assert.throws(() => insert.run('duplicate', org.id, project.id, 'SEARCH', 'low', '{}'), /UNIQUE/);
});

test('audit failures roll back both tool creation and edits', () => {
  const before = listTools('owner', org.id);
  db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT, 'audit failed'); END");
  try {
    assert.throws(() => createTool('owner', org.id, project.id, { ...details, name: 'Rolled back' }), /audit failed/);
    assert.throws(() => updateTool('owner', org.id, tool, { ...details, name: 'Rolled back' }, 'disabled'), /audit failed/);
    assert.deepEqual(listTools('owner', org.id), before);
  } finally { db.exec('DROP TRIGGER fail_audit'); }
});

test('input validation neither stores sample data nor echoes values in errors', () => {
  const marker = 'sample-secret-must-not-be-stored';
  const result = testToolInput('member', org.id, tool, JSON.stringify({ query: 'ok', limit: marker }));
  assert.equal(result.valid, false);
  assert.ok(!JSON.stringify(result).includes(marker));
  for (const table of ['tools', 'audit_logs']) {
    assert.ok(!JSON.stringify(db.prepare(`SELECT * FROM ${table}`).all()).includes(marker));
  }
});
