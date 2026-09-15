import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { migrationGate } from '../src/migration-gate.js';

let server: Server;
afterEach(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); });
async function start(env: NodeJS.ProcessEnv) {
  const app = express();
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(migrationGate(env));
  app.use((_req, res) => res.json({ passed: true }));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test listener.');
  return `http://127.0.0.1:${address.port}`;
}
describe('proteção de corte de infraestrutura sem alteração de regras', () => {
  it('fica inativa por padrão', async () => {
    const url = await start({});
    expect((await fetch(url + '/api/codes', { method: 'POST' })).status).toBe(200);
  });
  it('bloqueia leituras autenticadas e todas as escritas, mantendo health', async () => {
    const url = await start({ MAINTENANCE_MODE: 'true' });
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) expect((await fetch(url + '/api/auth/login', { method })).status).toBe(503);
    expect((await fetch(url + '/health')).status).toBe(200);
  });
  it('redireciona páginas mas nunca encaminha senhas ou mutações para outro host', async () => {
    const url = await start({ MIGRATION_REDIRECT_URL: 'https://sap-codigos-economico.fly.dev' });
    const response = await fetch(url + '/?view=query', { redirect: 'manual' });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://sap-codigos-economico.fly.dev/?view=query');
    expect((await fetch(url + '/api/auth/login', { method: 'POST' })).status).toBe(503);
  });
  it('rejeita destinos arbitrários', () => {
    expect(() => migrationGate({ MIGRATION_REDIRECT_URL: 'https://example.com' })).toThrow();
  });
});
