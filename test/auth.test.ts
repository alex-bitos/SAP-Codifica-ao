import { describe, expect, it, vi } from 'vitest';
import { hashPassword, normalizeLogin, passwordError, requireRoles, verifyPassword } from '../src/auth.js';

describe('autenticação', () => {
  it('normaliza login e rejeita senhas fracas', () => {
    expect(normalizeLogin(' Admin.Exemplo ')).toBe('admin.exemplo');
    expect(passwordError('curta')).toBeTruthy();
    expect(passwordError('Senha-Forte-123!')).toBeUndefined();
  });

  it('armazena somente hash Argon2id e valida a senha', async () => {
    const password = 'Senha-Forte-123!'; const hash = await hashPassword(password);
    expect(hash).toContain('$argon2id$'); expect(hash).not.toContain(password);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, 'Senha-Errada-123!')).toBe(false);
  });

  it('bloqueia rotas funcionais até a troca da senha temporária', () => {
    const request = { user: { role: 'Administrador', mustChangePassword: true }, path: '/codes' } as any;
    const json = vi.fn(); const status = vi.fn(() => ({ json })); const next = vi.fn();
    requireRoles('Administrador')(request, { status } as any, next);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'PASSWORD_CHANGE_REQUIRED' }));
    expect(next).not.toHaveBeenCalled();
  });
});
