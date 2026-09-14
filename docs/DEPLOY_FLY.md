# Implantação no Fly.io

Nenhum recurso pago deve ser criado antes da aprovação explícita do responsável.

## Proposta para aprovação

| Item | Proposta |
|---|---|
| Aplicação | `sap-codigos-multiusuario` |
| Managed Postgres | `sap-codigos-db` |
| Organização | A selecionar após `fly auth whoami` |
| Região | `gru` (São Paulo) |
| Aplicação | `shared-cpu-1x`, 512 MB, uma Machine mínima |
| Banco | Managed Postgres Basic, 2 vCPU compartilhadas, 1 GB RAM, 10 GB |
| Estimativa do banco | US$ 38/mês + US$ 2,80/mês por 10 GB, antes de impostos/tráfego |

A estimativa deve ser conferida no painel no momento da compra. Em setembro de 2026, a documentação do Fly.io informa que todos os planos MPG incluem alta disponibilidade, backup e pool de conexões. Referências: `https://fly.io/docs/mpg/` e `https://fly.io/docs/mpg/create-and-connect/`.

## Procedimento após aprovação

1. Instale `flyctl` pela documentação oficial.
2. Execute `fly auth whoami`. Se não houver sessão, pare e execute manualmente `fly auth login`; não informe senha a scripts ou terceiros.
3. Confirme organização e região com `fly orgs list` e `fly platform regions`.
4. Revise o nome `app` em `fly.toml` e crie a aplicação sem implantar: `fly apps create sap-codigos-multiusuario --org <ORGANIZACAO>`.
5. Crie o banco gerenciado somente após a aprovação do custo: `fly mpg create --name sap-codigos-db --org <ORGANIZACAO> --region gru --plan Basic --volume-size 10`.
6. Obtenha o ID em `fly mpg list` e conecte o banco: `fly mpg attach <CLUSTER_ID> --app sap-codigos-multiusuario`. O comando cadastra `DATABASE_URL` como segredo.
7. Cadastre configurações não sensíveis no `fly.toml` e segredos somente via `fly secrets set` ou entrada padrão. Nunca grave valores de segredo no histórico do shell ou no repositório.
8. Execute `fly deploy`. O `release_command` roda as migrações e cancela o deploy se elas falharem.
9. Verifique `https://sap-codigos-multiusuario.fly.dev/health` e `/ready`.
10. Crie o primeiro administrador com uma senha temporária fornecida apenas ao ambiente da Machine, execute `npm run admin:create` via console seguro e remova o segredo imediatamente: `fly secrets unset INITIAL_ADMIN_PASSWORD --app sap-codigos-multiusuario`.
11. Valide o Excel na interface e confirme a importação somente após revisar as contagens e conflitos.
12. Escale para duas Machines e execute os testes de concorrência com o mesmo banco. Reinicie e implante novamente; confirme que a contagem e os códigos permanecem.

No Windows, execute `scripts/finalizar-primeiro-acesso.ps1` para concluir o primeiro acesso. O script solicita login, nome e senha no próprio PowerShell. A senha é digitada de forma oculta e enviada pela entrada padrão; o script cria o administrador, importa a planilha e remove o arquivo remoto e todos os segredos temporários ao terminar.

O comando atual para Managed Postgres é `fly mpg`, não `fly postgres`; o último administra clusters não gerenciados. A ligação MPG injeta a URL com pool do PgBouncer. Referências oficiais: `https://fly.io/docs/flyctl/mpg/` e `https://fly.io/docs/flyctl/mpg-attach/`.

## Checklist de segurança

- `fly secrets list` mostra apenas nomes/digests; confira `DATABASE_URL` sem tentar exibir o valor.
- Remova todos os segredos temporários com `fly secrets unset <NOME>`.
- Mantenha `ALLOWED_ORIGINS=https://sap-codigos-multiusuario.fly.dev`.
- Não adicione volume à aplicação; os dados pertencem ao Managed Postgres.
- Consulte logs apenas para eventos e mensagens sanitizadas; a aplicação não registra senha, token, CSRF ou conexão.
