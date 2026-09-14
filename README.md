# Gerador e Controle de Códigos SAP

Aplicação web multiusuário que substitui o uso operacional do HTML/Excel local por uma API autenticada e um banco PostgreSQL central. O arquivo V3.11 e o Excel consolidado permanecem no repositório como fontes históricas e de migração; o navegador nunca se conecta diretamente ao banco.

## Arquitetura

- Frontend responsivo em HTML, CSS e JavaScript, servido pelo próprio backend.
- API REST em Node.js 22+ e TypeScript.
- PostgreSQL como fonte oficial única.
- Sessões revogáveis em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- Senhas Argon2id, CSRF por sessão, limitação de requisições, bloqueio temporário e Helmet/CSP.
- Migrações SQL versionadas e importação XLSX transacional/idempotente.
- Sequenciais alocados com `SELECT ... FOR UPDATE` em transação `SERIALIZABLE` e restrições únicas no banco.

## Execução local

Pré-requisitos: Node.js 22+ e PostgreSQL 16/17. O `compose.yaml` pode iniciar somente o banco quando Docker estiver disponível.

1. Copie `.env.example` para `.env` e substitua todos os valores fictícios localmente. Nunca versione `.env`.
2. Inicie o PostgreSQL: `docker compose up -d postgres`.
3. Instale dependências: `npm ci`.
4. Exporte as variáveis do `.env` no processo ou use o gerenciador de ambiente da sua preferência.
5. Execute `npm run migrate`.
6. Crie o primeiro administrador com as três variáveis temporárias `INITIAL_ADMIN_LOGIN`, `INITIAL_ADMIN_NAME` e `INITIAL_ADMIN_PASSWORD`: `npm run admin:create`.
7. Remova imediatamente `INITIAL_ADMIN_PASSWORD` do ambiente.
8. Inicie com `npm run dev` e abra `http://localhost:3000`.

O primeiro administrador é obrigado a trocar a senha no primeiro acesso. O script recusa criar outro administrador quando já existe um.

## Migração do Excel

Pela interface, um Administrador usa **Importação e auditoria**, seleciona o banco consolidado, executa a simulação e só então confirma o mesmo arquivo. A confirmação verifica novamente o SHA-256 e cancela a transação inteira em caso de erro.

Pela linha de comando, a primeira execução abaixo apenas simula:

```text
IMPORT_USER_LOGIN=admin.exemplo npm run import:initial -- Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx
```

Depois de revisar o relatório, repita com `CONFIRM_IMPORT=YES`. O arquivo só pode ser importado uma vez por hash.

## API

Os endpoints solicitados estão sob `/api`: autenticação, usuários, códigos individuais/lote, naturezas, categorias, referências, importação, exportação e auditoria. `/health` verifica o processo e `/ready` verifica também o PostgreSQL.

Perfis:

- `Administrador`: acesso integral, inclusive usuários, cadastros, importação e auditoria.
- `Codificador`: consulta, geração individual/lote e exportação.
- `Consulta`: somente consulta.

As permissões são aplicadas no backend. Elementos ocultos no frontend são apenas uma conveniência visual.

## Testes

- `npm test`: testes unitários, segurança e validação do Excel real.
- `TEST_DATABASE_URL=... npm run test:integration`: inclui concorrência contra um PostgreSQL real em schema isolado.
- `npm run build`: compilação TypeScript de produção.

Consulte [Relatório de testes](docs/RELATORIO_TESTES.md), [Relatório de migração](docs/RELATORIO_MIGRACAO.md), [Funcionalidades V3.11](docs/FUNCIONALIDADES_V311.md), [Deploy no Fly.io](docs/DEPLOY_FLY.md) e [Backup e restauração](docs/BACKUP_RESTAURACAO.md).
