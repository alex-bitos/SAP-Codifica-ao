import assert from 'node:assert/strict';
import { sourceConnection, proxy, connect, SOURCE_CLUSTER, safeCommand } from './migration-database.mjs';

const [mode = 'inspect'] = process.argv.slice(2);
assert(['inspect', 'freeze', 'unfreeze'].includes(mode));
const url = sourceConnection();
assert.equal(decodeURIComponent(url.username), 'sap_app');
if (mode !== 'inspect') safeCommand('flyctl', ['mpg', 'users', 'set-role', SOURCE_CLUSTER, '--username', 'sap_app', '--role', mode === 'freeze' ? 'reader' : 'schema_admin']);
const tunnel = await proxy(SOURCE_CLUSTER, 15432);
let client;
try {
  client = await connect(url, 15432, false);
  const identity = (await client.query('SELECT current_user,session_user')).rows[0];
  assert.equal(identity.session_user, 'sap_app');
  if (mode === 'freeze') {
    assert(['reader', 'sap_app'].includes(identity.current_user));
    assert.equal((await client.query("SELECT pg_has_role(session_user,'reader','MEMBER') AS reader")).rows[0].reader, true);
    await client.query('RESET ROLE');
    await client.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename=session_user AND datname=current_database() AND pid<>pg_backend_pid()');
    await client.query('SET ROLE reader');
    await client.query('BEGIN');
    let rejected = false;
    try { await client.query('UPDATE public.sap_codes SET sap_code=sap_code WHERE false'); }
    catch (error) { assert(['42501', '25006'].includes(error.code)); rejected = true; }
    await client.query('ROLLBACK');
    assert(rejected, 'Old login can still write; no cutover is permitted.');
    let escalationDenied = false;
    try { await client.query('SET ROLE schema_admin'); }
    catch (error) { assert.equal(error.code, '42501'); escalationDenied = true; }
    assert(escalationDenied, 'Reader login can escalate to schema_admin; no cutover is permitted.');
    console.log('Old application login is reader: mutation rejected, rollback completed, no rows changed.');
  }
  console.log(JSON.stringify({ mode, identity: (await client.query('SELECT current_user,session_user')).rows[0], transactionReadOnly: (await client.query('SHOW transaction_read_only')).rows[0].transaction_read_only, defaultTransactionReadOnly: (await client.query('SHOW default_transaction_read_only')).rows[0].default_transaction_read_only }));
} finally {
  await client?.end();
  tunnel.kill();
}
