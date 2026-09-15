import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import argon2 from 'argon2';
import * as XLSX from 'xlsx';
import { proxy, connect, safeCommand, TARGET_APP, secureDirectory, profile } from './migration-database.mjs';
import { TEST_DB, targetConnection, WEB_APP } from './migration-target.mjs';
import { buildDescription } from '../dist/domain/code-rules.js';

const out = await secureDirectory(process.argv[2]);
const base = `https://${WEB_APP}.fly.dev`;
const url = targetConnection(TEST_DB);
const password = crypto.randomBytes(24).toString('base64url') + '!aA1';
let tunnel = await proxy(TARGET_APP, 15532, true);
let client;
const tests = [];
const record = (name, details = {}) => { tests.push({ name, passed: true, ...details }); console.log(`PASS ${name}`); };
try {
  client = await connect(url, 15532);
  assert.equal((await client.query('SELECT current_database() AS db')).rows[0].db, TEST_DB);
  const hashed = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  for (const [login, role] of [['audit_admin', 'Administrador'], ['audit_coder', 'Codificador'], ['audit_reader', 'Consulta']]) {
    const existing = (await client.query('SELECT name FROM users WHERE login=$1', [login])).rows[0];
    if (existing) {
      assert.equal(existing.name, 'Migration ' + role, 'Never change an original user.');
      await client.query('UPDATE users SET password_hash=$2 WHERE login=$1', [login, hashed]);
    } else await client.query('INSERT INTO users(name,login,password_hash,role,must_change_password) VALUES ($1,$2,$3,$4,false)', ['Migration ' + role, login, hashed, role]);
  }
  const testUrl = new URL(url);
  testUrl.hostname = '127.0.0.1'; testUrl.port = '15532'; testUrl.searchParams.set('sslmode', 'no-verify');
  let integrationDone = false;
  try { integrationDone = /10 passed/.test(await fs.readFile(path.join(out, 'integration-results.txt'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!integrationDone) {
    const output = safeCommand(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'test/integration', '--no-file-parallelism'], { env: { ...process.env, TEST_DATABASE_URL: testUrl.href } });
    await fs.writeFile(path.join(out, 'integration-results.txt'), output);
  }
  record('PostgreSQL integration suites: import, rollback, 11 PA, batch and concurrency', { tests: 10 });
  for (const [script, directory] of [['scripts/visual-audit.mjs', 'visual-v311'], ['scripts/finished-products-visual-audit.mjs', 'visual-finished']]) {
    let completed = false;
    try { completed = JSON.parse(await fs.readFile(path.join(out, directory, 'evidence.json'), 'utf8')).ok === true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!completed) safeCommand(process.execPath, [script], { env: { ...process.env, AUDIT_APP_URL: base, AUDIT_TEST_PASSWORD: password, AUDIT_OUTPUT_DIR: path.join(out, directory) } });
    record(script);
  }
  async function login(name) {
    const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ login: name, password }) });
    assert.equal(response.status, 200, 'Login failed.');
    const data = await response.json();
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: data.user.csrfToken };
  }
  const admin = await login('audit_admin');
  const coder = await login('audit_coder');
  const reader = await login('audit_reader');
  async function request(session, route, method = 'GET', body) {
    const response = await fetch(base + '/api' + route, { method, headers: { Cookie: session.cookie, Origin: base, 'X-CSRF-Token': session.csrf, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    return { status: response.status, data };
  }
  assert.equal((await request(admin, '/users')).status, 200);
  assert.equal((await request(coder, '/users')).status, 403);
  assert.equal((await request(reader, '/codes', 'POST', {})).status, 403);
  record('Administrator/coder/read-only permissions and simultaneous sessions');
  const categories = (await request(admin, '/categories')).data.items;
  assert.equal(categories.length, 147);
  assert.equal((await request(coder, '/natures')).data.items.length, 12);
  for (const baseCode of ['MPTU', 'PITU']) assert((await request(coder, '/category-search?q=Tubo')).data.items.some(c => c.baseCode === baseCode));
  record('Central catalogs and quick search');
  const critical = categories.filter(c => ['Tubo', 'Flange', 'Pestana', 'União Roscada', 'União Solda de Encaixe'].includes(c.name));
  assert(critical.some(c => /Pestana/i.test(c.name)) && critical.some(c => /Uni/i.test(c.name)));
  for (const category of critical) {
    const fields = (await request(coder, `/categories/${category.id}/fields`)).data.items;
    assert(fields.length > 0);
    const attributes = Object.fromEntries(fields.map(field => [field.key, field.options?.[0] || `Migration ${field.key}`]));
    attributes.origem = 'I';
    if ('diametro_nominal' in attributes) attributes.diametro_nominal = 'NPS 3"';
    if ('diametro' in attributes) attributes.diametro = 'NPS 3"';
    if (category.name === 'Tubo') attributes.schedule_ou_espessura = 'SCH 120';
    if (category.name === 'Flange') attributes.norma_dimensional = 'ASME B16.47';
    if (category.name === 'Pestana') attributes.espessura = '4,13mm';
    if (category.name.startsWith('União')) attributes.norma_dimensional = 'ASME B16.11';
    if (category.name === 'União Solda de Encaixe') attributes.diametro_nominal = '3/4"';
    const prior = (await client.query("SELECT standardized_description,sequential,verification_digit FROM sap_codes WHERE category_id=$1 AND technical_attributes @> $2::jsonb AND source LIKE 'Aplicação%'", [category.id, JSON.stringify(attributes)])).rows[0];
    if (prior) {
      assert.equal(prior.standardized_description, buildDescription(category, attributes));
      assert.equal(prior.verification_digit, '');
      assert.match(prior.sequential, /^\d{6}$/);
      assert.equal((await request(admin, '/codes', 'POST', { categoryId: category.id, attributes })).status, 409);
      record(`Critical dynamic fields, canonical generation and duplicate: ${category.nature}/${category.name}`, { reusedPriorGeneration: true });
      continue;
    }
    const preview = await request(coder, '/codes/preview', 'POST', { categoryId: category.id, attributes });
    assert.equal(preview.status, 200, `Critical preview failed: ${category.nature}/${category.name}: ${JSON.stringify(preview.data)}`);
    assert.equal(preview.data.verificationDigit, '');
    assert.match(preview.data.sequential, /^\d{6}$/);
    const generated = await request(coder, '/codes', 'POST', { categoryId: category.id, attributes });
    assert.equal(generated.status, 201);
    assert.equal(generated.data.item.verification_digit, '');
    assert.match(generated.data.item.sequential, /^\d{6}$/);
    assert.equal(generated.data.item.standardized_description, preview.data.description);
    assert.equal((await request(admin, '/codes', 'POST', { categoryId: category.id, attributes })).status, 409);
    record(`Critical dynamic fields, canonical generation and duplicate: ${category.nature}/${category.name}`);
  }
  const category = categories.find(c => c.name === 'Suporte' && c.nature === 'Produto Acabado');
  const runId = crypto.randomUUID();
  const inputs = Array.from({ length: 20 }, (_, i) => ({ categoryId: category.id, attributes: { especificacao: `Migration concurrency ${runId} ${i}` } }));
  const created = await Promise.all(inputs.map((input, i) => request(i % 2 ? admin : coder, '/codes', 'POST', input)));
  assert(created.every(result => result.status === 201));
  assert.equal(new Set(created.map(result => result.data.item.sap_code)).size, 20);
  assert(created.every(result => /^\d{6}$/.test(result.data.item.sequential) && result.data.item.verification_digit === ''));
  assert.equal((await request(coder, '/codes', 'POST', inputs[0])).status, 409);
  record('20 concurrent API writes, six-digit sequence, empty DV and duplicate rejection');
  const adminTotal = (await request(admin, '/codes')).data.total;
  assert.equal((await request(coder, '/codes')).data.total, adminTotal);
  assert.equal((await request(reader, '/codes')).data.total, adminTotal);
  assert((await request(admin, '/audit')).data.items.some(item => item.action.includes('CODE')));
  record('Same persisted codes for three users and audit');
  const exported = await fetch(base + '/api/codes/export', { headers: { Cookie: coder.cookie } });
  assert.equal(exported.status, 200);
  const workbook = XLSX.read(Buffer.from(await exported.arrayBuffer()), { type: 'buffer' });
  assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets.Codigos).length, adminTotal);
  record('Excel export contains all persisted codes');
  await client.query('SET ROLE schema_admin');
  const before = await profile(client);
  await client.end(); client = undefined; tunnel.kill();
  const webMachines = JSON.parse(safeCommand('flyctl', ['machine', 'list', '-a', WEB_APP, '--json']));
  assert.equal(webMachines.length, 1);
  safeCommand('flyctl', ['machine', 'restart', webMachines[0].id, '-a', WEB_APP]);
  safeCommand('flyctl', ['machine', 'restart', '28743d9c542408', '-a', TARGET_APP]);
  tunnel = await proxy(TARGET_APP, 15532, true);
  client = await connect(url, 15532);
  await client.query('SET ROLE schema_admin');
  const after = await profile(client);
  // Sessions may receive asynchronous last_seen updates from previous HTTP requests.
  for (const table of Object.keys(before.data).filter(table => table !== 'public.sessions')) assert.equal(after.data[table].sha256, before.data[table].sha256, `Persistence failure in ${table}`);
  assert.equal(after.data['public.sessions'].rows, before.data['public.sessions'].rows);
  record('Application and PostgreSQL Machine restart: all business rows preserved', { codeCount: adminTotal });
  assert.equal((await request(coder, '/codes')).data.total, adminTotal);
  assert.equal((await request(admin, '/auth/logout', 'POST')).status, 200);
  assert.equal((await request(admin, '/codes')).status, 401);
  record('Logout revokes session; another user remains authenticated after restart');
  await fs.writeFile(path.join(out, 'regression-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base, database: TEST_DB, passed: true, tests, sequenceAndDv: true, businessRulesChanged: false }, null, 2));
  console.log(JSON.stringify({ passed: true, tests: tests.length, database: TEST_DB, outputDirectory: out }));
} finally {
  await client?.end();
  tunnel?.kill();
}
