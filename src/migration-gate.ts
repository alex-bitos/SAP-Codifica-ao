import type { RequestHandler } from 'express';

// Infrastructure-only gate: runs before authentication, which writes sessions.
export function migrationGate(env: NodeJS.ProcessEnv = process.env): RequestHandler {
  const maintenance = env.MAINTENANCE_MODE === 'true';
  const redirect = env.MIGRATION_REDIRECT_URL || '';
  if (redirect && redirect !== 'https://sap-codigos-economico.fly.dev') {
    throw new Error('Destino de migração não autorizado.');
  }
  return (req, res, next) => {
    if (!maintenance && !redirect) return next();
    res.setHeader('Cache-Control', 'no-store');
    if (redirect && ['GET', 'HEAD'].includes(req.method) && !req.path.startsWith('/api')) {
      return res.redirect(307, redirect + req.originalUrl);
    }
    res.setHeader('Retry-After', '60');
    return res.status(503).json({
      code: 'MIGRATION_MAINTENANCE',
      error: redirect ? 'Aplicação migrada. Acesse o novo endereço e entre novamente.' : 'Migração em andamento. Nenhuma alteração pode ser gravada neste ambiente.',
      ...(redirect ? { applicationUrl: redirect } : {}),
    });
  };
}
