import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import { hashPassword } from '../auth.js';
import { closePool, query } from '../db.js';
import { runMigrations } from '../migrate.js';
import { createBatch, createCode } from '../services/codes.js';
import { exportDatabase } from '../services/exporter.js';
import type { AuthUser } from '../types.js';

const password = String(process.env.AUDIT_TEST_PASSWORD || '');
if (!password) throw new Error('Defina AUDIT_TEST_PASSWORD somente no ambiente de homologação.');

const users: AuthUser[] = [
  { id: '', name: 'Auditoria Administrador', login: 'audit_admin', email: null, role: 'Administrador', mustChangePassword: false },
  { id: '', name: 'Auditoria Codificador', login: 'audit_coder', email: null, role: 'Codificador', mustChangePassword: false },
];

try {
  await runMigrations();
  const passwordHash = await hashPassword(password);
  for (const user of users) {
    const result = await query(`INSERT INTO users(name,login,password_hash,role,must_change_password)
      VALUES ($1,$2,$3,$4,false) ON CONFLICT (login) DO UPDATE SET password_hash=EXCLUDED.password_hash,
      role=EXCLUDED.role,active=true,must_change_password=false,updated_at=now() RETURNING id`,
    [user.name, user.login, passwordHash, user.role]);
    user.id = result.rows[0].id;
  }

  const countsBefore = (await query(`SELECT
    (SELECT count(*)::int FROM natures) AS natures,
    (SELECT count(*)::int FROM categories) AS categories,
    (SELECT count(*)::int FROM technical_references WHERE active=true) AS references,
    (SELECT count(*)::int FROM sap_codes WHERE source='Excel histórico') AS historical_codes,
    (SELECT count(*)::int FROM audit_log WHERE entity_type='legacy_history') AS historical_events`)).rows[0];
  if (countsBefore.natures !== 12 || countsBefore.categories !== 147 || countsBefore.references !== 574 || countsBefore.historical_codes !== 986 || countsBefore.historical_events !== 5) {
    throw new Error(`Contagens de homologação inesperadas: ${JSON.stringify(countsBefore)}`);
  }

  const category = (await query(`SELECT id FROM categories WHERE base_code='PACO' AND active=true`)).rows[0];
  if (!category) throw new Error('Categoria PACO não localizada.');
  const run = crypto.randomBytes(5).toString('hex');
  const created = await Promise.all(users.map((user, index) => createCode({
    categoryId: category.id, attributes: { especificacao: `Concorrência ${run}-${index + 1}` },
  }, user)));
  if (new Set(created.map((item) => item.sap_code)).size !== 2) throw new Error('A concorrência gerou código repetido.');
  if (!created.every((item) => /^[A-Z0-9]{8}\d{6}$/.test(item.sap_code) && /^\d{6}$/.test(item.sequential) && item.verification_digit === '')) {
    throw new Error('Formato de código, sequencial ou dígito verificador inválido.');
  }

  const duplicateRun = crypto.randomBytes(5).toString('hex');
  const duplicateSettled = await Promise.allSettled(users.map((user) => createCode({
    categoryId: category.id, attributes: { especificacao: `Duplicidade ${duplicateRun}` },
  }, user)));
  if (duplicateSettled.filter((item) => item.status === 'fulfilled').length !== 1 || duplicateSettled.filter((item) => item.status === 'rejected').length !== 1) {
    throw new Error('Duas confirmações simultâneas do mesmo item não foram reduzidas a uma única gravação.');
  }

  const batchRun = crypto.randomBytes(5).toString('hex');
  const batch = await createBatch([1, 2].map((index) => ({
    categoryId: category.id, attributes: { especificacao: `Lote ${batchRun}-${index}` },
  })), users[0]);
  if (batch.length !== 2 || new Set(batch.map((item) => item.sap_code)).size !== 2) throw new Error('Geração em lote não gravou dois códigos únicos.');
  const beforeRejectedBatch = (await query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total;
  let duplicateBatchBlocked = false;
  try {
    await createBatch([1, 2].map(() => ({ categoryId: category.id, attributes: { especificacao: `Lote duplicado ${batchRun}` } })), users[0]);
  } catch { duplicateBatchBlocked = true; }
  const afterRejectedBatch = (await query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total;
  if (!duplicateBatchBlocked || beforeRejectedBatch !== afterRejectedBatch) throw new Error('Lote duplicado não foi bloqueado com rollback integral.');

  const exportBuffer = await exportDatabase(users[0]);
  const exported = XLSX.read(exportBuffer, { type: 'buffer' });
  const requiredSheets = ['Codigos', 'Categorias', 'Referencias', 'Historico'];
  if (!requiredSheets.every((sheet) => exported.SheetNames.includes(sheet))) throw new Error('Exportação sem as quatro abas obrigatórias.');
  const exportedCodes = XLSX.utils.sheet_to_json(exported.Sheets.Codigos).length;
  const visibleToBoth = await Promise.all(users.map(async () => (await query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total));
  if (visibleToBoth[0] !== visibleToBoth[1]) throw new Error('Os dois usuários não consultaram a mesma quantidade.');

  console.log(JSON.stringify({
    ok: true, migrations: await runMigrations(), countsBefore, users: users.map((user) => ({ login: user.login, role: user.role })),
    concurrency: { created: created.map((item) => ({ code: item.sap_code, sequential: item.sequential, verificationDigit: item.verification_digit })), unique: true, duplicateRace: { written: 1, blocked: 1 } },
    batch: { created: batch.map((item) => item.sap_code), duplicateBlocked: true, rollback: true },
    sharedDatabase: { totalsSeen: visibleToBoth }, export: { sheets: exported.SheetNames, codes: exportedCodes },
  }, null, 2));
} finally { await closePool(); }
