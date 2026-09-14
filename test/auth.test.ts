import { describe, expect, it } from 'vitest';
import { hashPassword, normalizeLogin, passwordError, verifyPassword } from '../src/auth.js';

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
});
