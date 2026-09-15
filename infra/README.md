# Fly econômico — SAP Códigos

Produção: https://sap-codigos-economico.fly.dev. Banco privado sap-codigos-postgres-economico, volume persistente /data, PostgreSQL 16.15 com as extensões originais.

```powershell
# Web: fly.toml da raiz já identifica a nova produção
flyctl deploy --ha=false --yes

# PostgreSQL: uma única Machine; não expor portas/IPs públicos
flyctl deploy --config infra/fly.postgres.toml --ha=false --yes
```

Credenciais existem exclusivamente nos Fly secrets; não adicionar valores a esses arquivos. `scripts/migration-provision.mjs` verifica/cria somente os dois aplicativos novos de forma idempotente. No primeiro provisionamento, restaurar o banco antes de liberar usuários; ausência de banco interrompe o release command web, sem apontar a produção antiga automaticamente.

`fly.web-legado.toml` é somente arquivo histórico de recuperação; não usar seu release command no antigo somente leitura. A configuração alternativa `fly.web-economico.toml` equivale à nova web.

Consultar [estado/custos e autorização pendente](../docs/MIGRACAO_FLY_ECONOMICO_STATUS.md), [comparação](../docs/RELATORIO_COMPARACAO_BANCOS.md), [testes](../docs/RELATORIO_TESTES_FLY_ECONOMICO.md), [backup](../docs/BACKUP_RESTAURACAO_POSTGRES_ECONOMICO.md) e [rollback](../docs/PLANO_ROLLBACK_FLY_ECONOMICO.md).

Nenhum script de exclusão foi incluído. A janela de 72 horas e autorização explícita continuam obrigatórias; nenhum recurso da aplicação de soldagem pode ser alterado.
