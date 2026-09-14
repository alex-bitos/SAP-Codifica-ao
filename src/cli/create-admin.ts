import { hashPassword, normalizeLogin, passwordError } from '../auth.js';
import { closePool, transaction } from '../db.js';
import { runMigrations } from '../migrate.js';

const login = normalizeLogin(process.env.INITIAL_ADMIN_LOGIN);
const name = String(process.env.INITIAL_ADMIN_NAME || '').trim();
const password = String(process.env.INITIAL_ADMIN_PASSWORD || '');
if (!/^[a-z0-9._-]{3,80}$/.test(login) || !name || passwordError(password)) {
  throw new Error('Defina INITIAL_ADMIN_LOGIN, INITIAL_ADMIN_NAME e uma INITIAL_ADMIN_PASSWORD forte somente no ambiente.');
}

try {
  await runMigrations();
  const passwordHash = await hashPassword(password);
  await transaction(async (client) => {
    const existing = await client.query("SELECT 1 FROM users WHERE role='Administrador' LIMIT 1");
    if (existing.rowCount) throw new Error('Já existe um administrador; o bootstrap foi cancelado.');
    await client.query(`INSERT INTO users(name, login, password_hash, role, must_change_password)
      VALUES ($1,$2,$3,'Administrador',true)`, [name, login, passwordHash]);
  });
  console.log('Administrador inicial criado. Remova imediatamente o segredo temporário do ambiente.');
} finally { await closePool(); }
