import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// Credentials remain only in memory/child environments, never arguments or logs.
export const SOURCE_APP = 'sap-codigos-multiusuario';
export const SOURCE_CLUSTER = 'dzx6qo65n3g0jpv5';
export const SOURCE_DIRECT_IP = 'fdaa:af:206a:0:1::a';
export const TARGET_APP = 'sap-codigos-postgres-economico';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const canonical = value => JSON.stringify(sortObject(value));
function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortObject(value[key])]));
  return value;
}
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const quote = name => '"' + name.replaceAll('"', '""') + '"';

export function safeCommand(executable, args, options = {}) {
  const result = spawnSync(executable, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`Command failed: ${path.basename(executable)} (output withheld to protect credentials).`);
  return result.stdout;
}

export function sourceConnection() {
  const result = spawnSync('flyctl', ['ssh', 'console', '-a', SOURCE_APP, '-C', 'node -p JSON.stringify(process.env.DATABASE_URL)'], { encoding: 'utf8', windowsHide: true });
  // flyctl on Windows sometimes exits 1 after successful SSH output.
  const line = result.stdout?.split(/\r?\n/).find(line => /^"postgres(?:ql)?:\/\//.test(line));
  if (!line) throw new Error('Unable to securely obtain source connection. Raw SSH output withheld.');
  const url = new URL(JSON.parse(line));
  assert.equal(url.hostname, `pgbouncer.${SOURCE_CLUSTER}.flympg.net`, 'Unexpected source database host.');
  assert.equal(url.pathname, '/fly-db', 'Unexpected source database name.');
  return url;
}

export function libpqEnvironment(url, port, ssl = true) {
  return { ...process.env, PGHOST: '127.0.0.1', PGPORT: String(port), PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: ssl ? 'require' : 'disable', PGOPTIONS: '', PGCONNECT_TIMEOUT: '15' };
}

export async function proxy(cluster, port, unmanaged = false) {
  assert(unmanaged || cluster === SOURCE_CLUSTER, 'Unverified managed cluster.');
  const args = unmanaged ? ['proxy', `${port}:5432`, '-a', cluster, '--bind-addr', '127.0.0.1'] : ['proxy', `${port}:5432`, SOURCE_DIRECT_IP, '-o', 'personal', '-b', '127.0.0.1'];
  const child = spawn('flyctl', args, { windowsHide: true, stdio: 'ignore' });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error('Private proxy exited before becoming ready.');
    const ready = await new Promise(resolve => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.setTimeout(250);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
    });
    if (ready) return child;
    await sleep(250);
  }
  child.kill();
  throw new Error('Timed out starting private proxy.');
}

export async function connect(url, port, ssl = true) {
  const client = new pg.Client({ host: '127.0.0.1', port, database: decodeURIComponent(url.pathname.slice(1)), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), ssl: ssl ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 15000 });
  await client.connect();
  return client;
}

export async function profile(client) {
  const catalogQueries = {
    schemas: `SELECT nspname AS schema,pg_get_userbyid(nspowner) AS owner,nspacl::text AS acl FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema' ORDER BY 1`,
    tables: `SELECT table_schema,table_name,table_type FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2`,
    columns: `SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_schema,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale,identity_generation FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,4`,
    constraints: `SELECT n.nspname AS schema,t.relname AS table_name,c.conname,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3`,
    indexes: `SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3`,
    functions: `SELECT n.nspname AS schema,p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind IN ('f','p') ORDER BY 1,2,3`,
    views: `SELECT n.nspname AS schema,c.relname,pg_get_viewdef(c.oid,true) AS definition FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND c.relkind IN ('v','m') ORDER BY 1,2`,
    triggers: `SELECT n.nspname AS schema,c.relname,t.tgname,pg_get_triggerdef(t.oid,true) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND NOT t.tgisinternal ORDER BY 1,2,3`,
    extensions: `SELECT e.extname,e.extversion,n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY 1`,
    sequences: `SELECT schemaname,sequencename,data_type,start_value,min_value,max_value,increment_by,cycle,cache_size,last_value FROM pg_sequences WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2`,
    owners: `SELECT n.nspname AS schema,c.relname,c.relkind,pg_get_userbyid(c.relowner) AS owner,c.relacl::text AS acl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND c.relkind IN ('r','S','v','m') ORDER BY 1,2`,
  };
  const result = { catalogs: {}, data: {}, business: {} };
  for (const [name, sql] of Object.entries(catalogQueries)) result.catalogs[name] = (await client.query(sql)).rows;
  result.catalogs.sequenceStates = [];
  for (const sequence of result.catalogs.sequences) {
    const state = (await client.query(`SELECT last_value::text,is_called FROM ${quote(sequence.schemaname)}.${quote(sequence.sequencename)}`)).rows[0];
    result.catalogs.sequenceStates.push({ schema: sequence.schemaname, name: sequence.sequencename, ...state });
  }
  for (const table of result.catalogs.tables.filter(table => table.table_type === 'BASE TABLE')) {
    const identity = `${table.table_schema}.${table.table_name}`;
    const qualified = `${quote(table.table_schema)}.${quote(table.table_name)}`;
    const rows = (await client.query(`SELECT to_jsonb(t) AS row FROM ${qualified} t`)).rows.map(row => canonical(row.row)).sort();
    const columns = result.catalogs.columns.filter(column => column.table_schema === table.table_schema && column.table_name === table.table_name);
    const ranges = {};
    for (const column of columns.filter(column => column.column_name === 'id' || /timestamp|date/.test(column.data_type))) {
      const field = quote(column.column_name);
      const aggregateField = column.udt_name === 'uuid' ? `${field}::text` : field;
      ranges[column.column_name] = (await client.query(`SELECT min(${aggregateField})::text AS min,max(${aggregateField})::text AS max FROM ${qualified}`)).rows[0];
    }
    result.data[identity] = { rows: rows.length, sha256: hash(rows.join('\n')), ranges };
  }
  if (result.data['public.sap_codes']) {
    result.business.distribution = (await client.query(`SELECT nature_code,category_code,status,count(*)::int AS count FROM sap_codes GROUP BY 1,2,3 ORDER BY 1,2,3`)).rows;
    result.business.codes = (await client.query(`SELECT sap_code FROM sap_codes ORDER BY canonical_code`)).rows.map(row => row.sap_code);
    result.business.duplicates = (await client.query(`SELECT 'canonical' AS type,count(*)::int FROM (SELECT canonical_code FROM sap_codes GROUP BY 1 HAVING count(*)>1) d UNION ALL SELECT 'technical',count(*)::int FROM (SELECT nature_id,technical_key FROM sap_codes WHERE technical_key IS NOT NULL AND technical_key<>'' AND status IN ('Ativo','Aprovado','Provisório') GROUP BY 1,2 HAVING count(*)>1) d ORDER BY 1`)).rows;
    result.business.roles = (await client.query('SELECT role,active,count(*)::int AS count FROM users GROUP BY 1,2 ORDER BY 1,2')).rows;
  }
  result.sha256 = hash(canonical(result));
  return result;
}

export async function secureDirectory(directory) {
  const resolved = path.resolve(directory);
  assert(resolved.toLowerCase() !== process.cwd().toLowerCase() && !resolved.toLowerCase().startsWith(process.cwd().toLowerCase() + path.sep), 'Backup must remain outside the repository.');
  await fs.mkdir(resolved, { recursive: true, mode: 0o700 });
  if (process.platform === 'win32') safeCommand('icacls', [resolved, '/inheritance:r', '/grant:r', `${process.env.USERDOMAIN}\\${process.env.USERNAME}:(OI)(CI)F`]);
  return resolved;
}

export async function backup(directory, options = {}) {
  const out = await secureDirectory(directory);
  const bin = process.env.PG_BIN_DIR;
  assert(bin, 'Set PG_BIN_DIR to PostgreSQL 16 client binaries.');
  const version = safeCommand(path.join(bin, 'pg_dump.exe'), ['--version']).trim();
  assert.match(version, /16\./, 'Use the source-compatible PostgreSQL 16 client.');
  const manifestPath = path.join(out, 'manifest.json');
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    assert.equal(manifest.sourceApp, options.app || SOURCE_APP, 'Backup directory belongs to another source.');
    for (const [file, sha256] of Object.entries(manifest.files)) assert.equal(hash(await fs.readFile(path.join(out, file))), sha256);
    console.log(JSON.stringify({ reused: true, directory: out, files: manifest.files }));
    return;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const url = options.url || sourceConnection();
  const cluster = options.cluster || SOURCE_CLUSTER;
  const port = options.port || 15432;
  const ssl = options.ssl || false;
  const child = await proxy(cluster, port, Boolean(options.unmanaged));
  let client;
  try {
    // The MPG direct endpoint uses the encrypted Fly WireGuard network;
    // unlike the pooled endpoint it does not negotiate PostgreSQL TLS.
    const env = libpqEnvironment(url, port, ssl);
    client = await connect(url, port, ssl);
    if (options.role) await client.query(`SET ROLE ${quote(options.role)}`);
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const snapshot = (await client.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
    const metadata = (await client.query('SELECT version(),current_database(),current_user,pg_database_size(current_database()) AS bytes')).rows[0];
    safeCommand(path.join(bin, 'pg_dump.exe'), ['--format=custom', `--snapshot=${snapshot}`, '--file', path.join(out, 'database.dump')], { env });
    safeCommand(path.join(bin, 'pg_dump.exe'), ['--schema-only', `--snapshot=${snapshot}`, '--file', path.join(out, 'schema.sql')], { env });
    const databaseProfile = await profile(client);
    await client.query('COMMIT');
    await fs.writeFile(path.join(out, 'profile.json'), JSON.stringify(databaseProfile, null, 2));
    const files = {};
    for (const file of ['database.dump','schema.sql','profile.json']) files[file] = hash(await fs.readFile(path.join(out, file)));
    const toc = safeCommand(path.join(bin, 'pg_restore.exe'), ['--list', path.join(out, 'database.dump')]);
    const manifest = { createdAt: new Date().toISOString(), sourceApp: options.app || SOURCE_APP, sourceCluster: cluster, metadata, clientVersion: version, files, archiveEntries: toc.split('\n').filter(line => /^\d+;/.test(line)).length, counts: Object.fromEntries(Object.entries(databaseProfile.data).map(([table, value]) => [table, value.rows])) };
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    await client?.end();
    child.kill();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, directory] = process.argv.slice(2);
  assert(command === 'backup' && directory, 'Usage: migration-database.mjs backup OUTSIDE_GIT_DIRECTORY');
  await backup(directory);
}
