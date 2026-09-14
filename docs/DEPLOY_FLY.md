# Atualização no Fly.io

## Estado atual

- Aplicação de produção: `sap-codigos-multiusuario`.
- Endereço: `https://sap-codigos-multiusuario.fly.dev`.
- Região: `gru`.
- Aplicação: uma Machine `shared-cpu-1x`, 512 MB.
- Banco: Managed Postgres Basic, 10 GB, acessado por `DATABASE_URL`.
- Produção antes desta auditoria: 12 naturezas, 147 categorias, 601 referências, 986 códigos e 1 usuário.
- Auditoria V3.11: homologada separadamente; ainda não implantada em produção.

Não crie outro aplicativo ou banco. A próxima implantação deve atualizar os recursos existentes e só pode ocorrer depois de autorização explícita e backup verificado.

## Preparação obrigatória

1. Confirme a conta com `flyctl auth whoami`.
2. Confirme a branch e o commit aprovados com `git status` e `git log -1 --oneline`.
3. Confira a saúde atual com `flyctl status --app sap-codigos-multiusuario`.
4. Registre as contagens atuais de `users`, `natures`, `categories`, `technical_references`, `sap_codes`, `audit_log` e `database_imports`.
5. Confirme no painel do Managed Postgres que o backup automático recente está íntegro.
6. Gere também um `pg_dump` lógico criptografado e teste a leitura do arquivo. Não grave conexão ou senha no histórico.
7. Revise as migrações `002_v311_category_parity.sql`, `003_v311_reference_parity.sql` e `004_v311_reference_activation_parity.sql`. As migrações de referência apenas inativam aliases obsoletos; não excluem registros.

## Implantação aprovada

```powershell
Set-Location 'C:\Git\SAP-Codifica-ao'
git status
flyctl deploy --app sap-codigos-multiusuario
flyctl status --app sap-codigos-multiusuario
```

O `release_command` executa `node dist/cli/migrate.js` antes da troca da Machine. Se uma migração falhar, o deploy deve ser interrompido.

Depois do deploy:

1. confirme 2/2 health checks;
2. abra `/health` e `/ready`;
3. entre com um Administrador e confirme carga automática das naturezas/categorias;
4. valide busca rápida, Tubo MP/PI, Chapa, Flange e Instrumento;
5. confira diretamente as contagens do PostgreSQL;
6. confirme que os 986 códigos históricos não mudaram;
7. exporte o Excel e confira as quatro abas;
8. faça login com um segundo usuário e confirme o mesmo total;
9. monitore logs e auditoria sem exibir segredos.

## Seed e importação

`npm run seed:v311` serve para banco vazio de homologação ou primeira instalação. Não deve ser executado sobre a produção já populada durante a atualização.

A interface administrativa pode simular a planilha e mostrar existentes, inclusões e bloqueios. Não confirme uma nova importação em produção sem revisar o relatório e sem autorização específica, mesmo que a simulação seja válida.

## Reversão

Se houver falha de aplicação sem migração de dados, use o histórico de releases do Fly.io para voltar à imagem anterior. Se houver divergência de dados, interrompa escritas, preserve logs e restaure em novo banco conforme `docs/BACKUP_RESTAURACAO.md`; nunca restaure por cima do banco ativo sem decisão formal.

## Segredos

- `flyctl secrets list` mostra somente nomes e digests.
- Não exiba `DATABASE_URL`, senhas, tokens ou CSRF.
- Mantenha `ALLOWED_ORIGINS=https://sap-codigos-multiusuario.fly.dev`.
- Remova imediatamente qualquer segredo temporário de administrador.
- Não adicione volume à aplicação; os dados pertencem ao Managed Postgres.
