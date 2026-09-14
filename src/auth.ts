import crypto from 'node:crypto';
import argon2 from 'argon2';
import type { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { loadConfig } from './config.js';
import { getPool, transaction } from './db.js';
import { audit } from './audit.js';
import type { AuthUser, Role } from './types.js';

declare global {
  namespace Express {
    interface Request { user?: AuthUser; sessionId?: string; csrfToken?: string; }
  }
}

const COOKIE = 'sap_session';
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

export function normalizeLogin(value: unknown) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase();
}

export function passwordError(password: string): string | undefined {
  if (password.length < 12 || password.length > 128) return 'A senha deve ter entre 12 e 128 caracteres.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'A senha deve conter maiúscula, minúscula, número e símbolo.';
  }
}

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(passwordHash: string, password: string) {
  try { return await argon2.verify(passwordHash, password); } catch { return false; }
}

function cookieValue(req: Request, name: string): string {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function setCookie(res: Response, token: string) {
  const secure = loadConfig().NODE_ENV === 'production';
  res.cookie(COOKIE, token, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: loadConfig().SESSION_TTL_HOURS * 3600_000, priority: 'high' });
}

export async function createSession(client: PoolClient, req: Request, res: Response, user: AuthUser) {
  const token = randomToken();
  const csrfToken = randomToken();
  const expiresAt = new Date(Date.now() + loadConfig().SESSION_TTL_HOURS * 3600_000);
  await client.query(`INSERT INTO sessions(token_hash, csrf_token_hash, user_id, expires_at, ip_address, user_agent)
    VALUES ($1,$2,$3,$4,$5,$6)`, [hash(token), hash(csrfToken), user.id, expiresAt, req.ip || null, String(req.get('user-agent') || '').slice(0, 500)]);
  setCookie(res, token);
  return csrfToken;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = cookieValue(req, COOKIE);
    if (!token) return next();
    const result = await getPool().query(`SELECT s.id AS session_id, s.csrf_token_hash,
      u.id, u.name, u.login, u.email, u.role, u.must_change_password
      FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`, [hash(token)]);
    const row = result.rows[0];
    if (!row) return next();
    req.user = { id: row.id, name: row.name, login: row.login, email: row.email, role: row.role, mustChangePassword: row.must_change_password };
    req.sessionId = row.session_id;
    req.csrfToken = row.csrf_token_hash;
    void getPool().query('UPDATE sessions SET last_seen_at=now() WHERE id=$1', [row.session_id]);
    next();
  } catch (error) { next(error); }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Autenticação necessária.' });
  if (req.user.mustChangePassword && req.path !== '/auth/change-password' && req.path !== '/auth/logout') {
    return res.status(403).json({ error: 'Troque a senha inicial antes de continuar.', code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  next();
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Autenticação necessária.' });
    if (req.user.mustChangePassword && req.path !== '/auth/change-password' && req.path !== '/auth/logout') {
      return res.status(403).json({ error: 'Troque a senha inicial antes de continuar.', code: 'PASSWORD_CHANGE_REQUIRED' });
    }
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Perfil sem permissão para esta operação.' });
    next();
  };
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || ['/auth/login'].includes(req.path)) return next();
  if (!req.user || !req.csrfToken) return res.status(401).json({ error: 'Autenticação necessária.' });
  const presented = String(req.get('x-csrf-token') || '');
  const actual = hash(presented);
  const expected = req.csrfToken;
  if (actual.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    return res.status(403).json({ error: 'Token CSRF inválido.' });
  }
  next();
}

export async function login(req: Request, res: Response) {
  const loginName = normalizeLogin(req.body?.login);
  const password = String(req.body?.password || '');
  const config = loadConfig();
  const result = await getPool().query('SELECT * FROM users WHERE login=$1 OR lower(email)=$1', [loginName]);
  const row = result.rows[0];
  const blocked = row?.locked_until && new Date(row.locked_until).getTime() > Date.now();
  const valid = row?.active && !blocked && await verifyPassword(row.password_hash, password);
  if (!valid) {
    await transaction(async (client) => {
      if (row && !blocked) {
        const attempts = Number(row.failed_login_attempts) + 1;
        const lock = attempts >= config.LOGIN_MAX_ATTEMPTS ? `${config.LOGIN_LOCK_MINUTES} minutes` : null;
        await client.query(`UPDATE users SET failed_login_attempts=$2,
          locked_until=CASE WHEN $3::text IS NULL THEN locked_until ELSE now()+$3::interval END, updated_at=now() WHERE id=$1`, [row.id, attempts, lock]);
      }
      await audit(client, blocked ? 'LOGIN_BLOCKED' : 'LOGIN_FAILED', 'user', row?.id || loginName, undefined, { ip: req.ip, details: { login: loginName } });
    });
    return res.status(blocked ? 423 : 401).json({ error: blocked ? 'Conta temporariamente bloqueada.' : 'Login ou senha inválidos.' });
  }
  const user: AuthUser = { id: row.id, name: row.name, login: row.login, email: row.email, role: row.role, mustChangePassword: row.must_change_password };
  const csrfToken = await transaction(async (client) => {
    await client.query('UPDATE users SET failed_login_attempts=0, locked_until=NULL, last_access_at=now(), updated_at=now() WHERE id=$1', [row.id]);
    const csrf = await createSession(client, req, res, user);
    await audit(client, 'LOGIN_SUCCESS', 'user', row.id, user, { ip: req.ip });
    return csrf;
  });
  return res.json({ user: { ...user, csrfToken } });
}

export async function logout(req: Request, res: Response) {
  await transaction(async (client) => {
    if (req.sessionId) await client.query('DELETE FROM sessions WHERE id=$1', [req.sessionId]);
    if (req.user) await audit(client, 'LOGOUT', 'user', req.user.id, req.user, { ip: req.ip });
  });
  res.clearCookie(COOKIE, { httpOnly: true, secure: loadConfig().NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  res.json({ ok: true });
}

export async function changePassword(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Autenticação necessária.' });
  const current = String(req.body?.currentPassword || '');
  const nextPassword = String(req.body?.newPassword || '');
  const error = passwordError(nextPassword);
  if (error) return res.status(400).json({ error });
  const result = await getPool().query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!result.rows[0] || !await verifyPassword(result.rows[0].password_hash, current)) return res.status(401).json({ error: 'Senha atual inválida.' });
  const passwordHash = await hashPassword(nextPassword);
  await transaction(async (client) => {
    await client.query('UPDATE users SET password_hash=$2, must_change_password=false, updated_at=now() WHERE id=$1', [req.user!.id, passwordHash]);
    await client.query('DELETE FROM sessions WHERE user_id=$1 AND id<>$2', [req.user!.id, req.sessionId]);
    await audit(client, 'PASSWORD_CHANGED', 'user', req.user!.id, req.user, { ip: req.ip });
  });
  res.json({ ok: true });
}
