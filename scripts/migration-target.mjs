import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TARGET_APP, safeCommand, proxy, connect, libpqEnvironment, profile, secureDirectory, backup } from './migration-database.mjs';

export const TEST_DB = 'sap_migration_test';
export const RESTORE_VERIFY_DB = 'sap_restore_verify_20260915';
export const RESTORE_FINAL_DB = 'sap_restore_final_20260915';
export const WEB_APP = 'sap-codigos-economico';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const quoted = value => '"' + value.replaceAll('"', '""') + '"';

export function targetPassword(name) {
  assert(['POSTGRES_PASSWORD', 'SAP_APP_PASSWORD'].includes(name));
  const result = spawnSync('flyctl', ['ssh', 'console', '-a', TARGET_APP, '-C', `printenv ${name}`], { encoding: 'utf8', windowsHide: true });
  const value = result.stdout?.split(/\r?\n/).find(line => /^[A-Za-z0-9_-]{48}$/.test(line));
  assert(value, 'Unable to retrieve target credential securely. Raw output withheld.');
  return value;
}

export function targetConnection(database = 'postgres', appUser = false) {
  assert(['postgres', 'template1', TEST_DB, RESTORE_VERIFY_DB, RESTORE_FINAL_DB, 'fly-db'].includes(database), 'Unverified target database.');
  const url = new URL(`postgresql://${appUser ? 'sap_app' : 'postgres'}@${TARGET_APP}.internal/${database}`);
  url.password = targetPassword(appUser ? 'SAP_APP_PASSWORD' : 'POSTGRES_PASSWORD');
  return url;
}

export function importSecrets(app, entries) {
  assert([TARGET_APP, WEB_APP, 'sap-codigos-multiusuario'].includes(app));
  for (const [key, value] of Object.entries(entries)) {
    assert(/^[A-Z_]+$/.test(key) && !/[\r\n]/.test(value), 'Invalid secret input.');
  }
  safeCommand('flyctl', ['secrets', 'import', '-a', app], { input: Object.entries(entries).map(([key, value]) => `${key}=${value}`).join('\n') + '\n' });
  console.log(`Updated secret names in ${app}: ${Object.keys(entries).join(', ')}. Values withheld.`);
}

async function restore(directory, database) {
  assert([TEST_DB, RESTORE_VERIFY_DB, RESTORE_FINAL_DB, 'fly-db'].includes(database));
  const out = await secureDirectory(directory);
  const manifest = JSON.parse(await fs.readFile(path.join(out, 'manifest.json'), 'utf8'));
  for (const [file, checksum] of Object.entries(manifest.files)) assert.equal(digest(await fs.readFile(path.join(out, file))), checksum);
  const tunnel = await proxy(TARGET_APP, 15532, true);
  let admin, restored;
  try {
    const adminUrl = targetConnection();
    admin = await connect(adminUrl, 15532);
    await admin.query('SET pg_stat_monitor.pgsm_track=none');
    for (const role of ['schema_admin', 'reader', 'writer']) {
      if (!(await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role])).rowCount) await admin.query(`CREATE ROLE ${quoted(role)} NOLOGIN`);
    }
    if (!(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='sap_app'")).rowCount) {
      const password = targetPassword('SAP_APP_PASSWORD');
      assert(/^[A-Za-z0-9_-]{48}$/.test(password));
      // Monitoring and statement logging are disabled before credential SQL.
      try { await admin.query(`CREATE ROLE sap_app LOGIN PASSWORD '${password}'`); }
      catch { throw new Error('Secure application role creation failed; raw SQL errors withheld to protect credentials.'); }
    }
    await admin.query('GRANT schema_admin TO sap_app');
    await admin.query('GRANT pg_read_all_data,pg_write_all_data TO schema_admin,writer');
    await admin.query('GRANT pg_read_all_data TO reader');
    await admin.query('ALTER ROLE sap_app SET role=schema_admin');
    const exists = (await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [database])).rowCount;
    if (!exists) await admin.query(`CREATE DATABASE ${quoted(database)} OWNER schema_admin TEMPLATE template0 ENCODING 'UTF8'`);
    const url = targetConnection(database);
    restored = await connect(url, 15532);
    const tables = (await restored.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).rows[0].count;
    if (!tables) {
      safeCommand(path.join(process.env.PG_BIN_DIR, 'pg_restore.exe'), ['--exit-on-error', '--single-transaction', '--dbname', database, path.join(out, 'database.dump')], { env: libpqEnvironment(url, 15532) });
    }
    const sequenceSafety = (await restored.query('SELECT (SELECT max(id) FROM audit_log)::text AS maximum,last_value::text,is_called FROM audit_log_id_seq')).rows[0];
    assert(BigInt(sequenceSafety.last_value) + (sequenceSafety.is_called ? 1n : 0n) > BigInt(sequenceSafety.maximum || '0'), 'Sequence is behind existing IDs. Stop before cutover; never reset downward.');
    await restored.query('SET ROLE schema_admin');
    const actual = await profile(restored);
    const expected = JSON.parse(await fs.readFile(path.join(out, 'profile.json'), 'utf8'));
    const differences = [];
    for (const section of ['catalogs', 'data', 'business']) {
      for (const key of new Set([...Object.keys(expected[section]), ...Object.keys(actual[section])])) {
        if (JSON.stringify(expected[section][key]) !== JSON.stringify(actual[section][key])) differences.push({ section, key, expected: expected[section][key], actual: actual[section][key] });
      }
    }
    const report = { generatedAt: new Date().toISOString(), stage: database === TEST_DB ? 'test-restore' : database === 'fly-db' ? 'final-restore' : 'new-production-backup-restore', targetApp: TARGET_APP, database, backupChecksums: manifest.files, sourceProfileHash: expected.sha256, targetProfileHash: actual.sha256, sequenceSafety, businessMatch: !differences.some(d => ['data', 'business'].includes(d.section)), fullMatch: !differences.length, counts: Object.fromEntries(Object.entries(actual.data).map(([key, value]) => [key, value.rows])), differences };
    // This contains only catalogs, counts, hashes and public SAP code lists, not user rows/hashes.
    await fs.writeFile(path.join(out, `comparison-${database}.json`), JSON.stringify(report, null, 2));
    await fs.writeFile(path.join(out, `restored-profile-${database}.json`), JSON.stringify(actual, null, 2));
    console.log(JSON.stringify({ ...report, differences: differences.map(d => ({ section: d.section, key: d.key })) }, null, 2));
    assert(report.fullMatch, 'Restore comparison has differences. No cutover is permitted. Detailed report is outside Git.');
  } finally {
    await restored?.end();
    await admin?.end();
    tunnel.kill();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, directory, database = TEST_DB] = process.argv.slice(2);
  assert(['restore', 'backup'].includes(command) && directory, 'Usage: migration-target.mjs restore BACKUP_DIRECTORY DATABASE | backup OUTSIDE_GIT_DIRECTORY');
  if (command === 'backup') await backup(directory, { url: targetConnection('fly-db'), cluster: TARGET_APP, port: 15532, ssl: true, unmanaged: true, app: TARGET_APP, role: 'schema_admin' });
  else await restore(directory, database);
}
