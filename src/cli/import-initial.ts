import fs from 'node:fs/promises';
import path from 'node:path';
import { closePool, query } from '../db.js';
import { runMigrations } from '../migrate.js';
import { analyzeWorkbook, importWorkbook } from '../services/importer.js';

const filePath = path.resolve(process.argv[2] || 'Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx');
const login = String(process.env.IMPORT_USER_LOGIN || process.env.INITIAL_ADMIN_LOGIN || '').toLowerCase();
if (!login) throw new Error('Defina IMPORT_USER_LOGIN com o login de um administrador existente.');

try {
  await runMigrations();
  const userResult = await query('SELECT id,name,login,email,role,must_change_password FROM users WHERE login=$1 AND role=$2', [login, 'Administrador']);
  if (!userResult.rows[0]) throw new Error('Administrador de importação não encontrado.');
  const buffer = await fs.readFile(filePath);
  const analysis = analyzeWorkbook(buffer, path.basename(filePath));
  console.log(JSON.stringify({ ...analysis, rows: undefined }, null, 2));
  if (process.env.CONFIRM_IMPORT !== 'YES') throw new Error('Simulação concluída. Defina CONFIRM_IMPORT=YES para confirmar o mesmo arquivo.');
  const row = userResult.rows[0];
  const result = await importWorkbook(buffer, path.basename(filePath), analysis.fileHash, {
    id: row.id, name: row.name, login: row.login, email: row.email, role: row.role, mustChangePassword: row.must_change_password,
  });
  console.log(JSON.stringify(result, null, 2));
} finally { await closePool(); }
