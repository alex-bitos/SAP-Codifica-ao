import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { closePool, query } from '../db.js';
import { runMigrations } from '../migrate.js';
import { analyzeWorkbook, importWorkbook } from '../services/importer.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(here, '../../seeds/v311-complete.json');
const login = String(process.env.IMPORT_USER_LOGIN || process.env.INITIAL_ADMIN_LOGIN || '').toLowerCase();
if (!login) throw new Error('Defina IMPORT_USER_LOGIN com o login de um administrador existente.');

try {
  await runMigrations();
  const userResult = await query('SELECT id,name,login,email,role,must_change_password FROM users WHERE login=$1 AND role=$2', [login, 'Administrador']);
  if (!userResult.rows[0]) throw new Error('Administrador de importação não encontrado.');
  const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'));
  const workbook = XLSX.utils.book_new();
  for (const name of ['Codigos', 'Categorias', 'Referencias', 'Historico']) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(seed.sheets[name]), name);
  const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true }));
  const analysis = analyzeWorkbook(buffer, 'seed-v311-complete.xlsx');
  console.log(JSON.stringify({ ...analysis, rows: undefined }, null, 2));
  if (process.env.CONFIRM_IMPORT !== 'YES') throw new Error('Simulação concluída. Defina CONFIRM_IMPORT=YES para confirmar o seed.');
  const row = userResult.rows[0];
  console.log(JSON.stringify(await importWorkbook(buffer, 'seed-v311-complete.xlsx', analysis.fileHash, {
    id: row.id, name: row.name, login: row.login, email: row.email, role: row.role, mustChangePassword: row.must_change_password,
  }), null, 2));
} finally { await closePool(); }
