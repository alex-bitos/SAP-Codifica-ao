import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { loadConfig } from './config.js';
import { getPool } from './db.js';
import routes from './routes.js';

export function createApp() {
  const config = loadConfig();
  const app = express();
  app.set('trust proxy', 1); app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"] } }, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
  const allowed = new Set(config.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const origin = req.get('origin');
    if (origin && !allowed.has(origin)) return res.status(403).json({ error: 'Origem não autorizada.' });
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Credentials', 'true'); }
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-CSRF-Token'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS'); return res.sendStatus(204); }
    next();
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', async (_req, res) => { try { await getPool().query('SELECT 1'); res.json({ status: 'ready' }); } catch { res.status(503).json({ status: 'not_ready' }); } });
  app.use('/api', routes);
  const here = path.dirname(fileURLToPath(import.meta.url)); const projectRoot = path.resolve(here, '..');
  const publicDir = path.join(projectRoot, 'public');
  app.use('/vendor/xlsx', express.static(path.join(projectRoot, 'node_modules', 'xlsx', 'dist'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(publicDir, { index: 'index.html', maxAge: config.NODE_ENV === 'production' ? '1h' : 0 }));
  app.get('*path', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
    const status = error?.status || (error instanceof ZodError ? 400 : error?.code === '23505' ? 409 : 500);
    if (status >= 500) console.error('Erro interno:', error?.message);
    res.status(status).json({ error: status >= 500 ? 'Erro interno do servidor.' : error.message, issues: error instanceof ZodError ? error.issues : undefined });
  });
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const config = loadConfig();
  createApp().listen(config.PORT, '0.0.0.0', () => console.log(`Gerador SAP disponível na porta ${config.PORT}.`));
}
