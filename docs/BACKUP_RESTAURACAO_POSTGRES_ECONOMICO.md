# Backup e restauração do PostgreSQL econômico

Atualização em 15/09/2026: cluster e web antigos excluídos com autorização e dispensa expressa da janela. Dois backups adicionais foram gerados e restaurados efetivamente em bancos novos antes da exclusão, com comparação integral de 100%; [checksums e comprovantes](EXCLUSAO_FLY_ECONOMICO_20260915.md). Não contar com recuperação do recurso antigo; os dumps externos foram preservados.

Banco de produção: `fly-db`, em `sap-codigos-postgres-economico`. Dados persistem no volume criptografado `vol_vjyqoddddne8ooxv`, montado em `/data`; PGDATA = `/data/postgresql`. As tabelas sap_codes, users, categories, technical_references, sequential_counters, audit_log e database_imports são o armazenamento central; a planilha não é o banco da aplicação.

## Segurança e ferramentas

Backups ficam fora do Git, sob `C:\Users\alexandre\AppData\Local\SAP-Codigos-Backups`, com herança ACL desativada e acesso restrito ao usuário atual. Dumps contêm hashes de senha e outros dados da aplicação: não publicar, enviar ou copiar para um diretório compartilhado sem proteção apropriada.

Clientes PostgreSQL 16.15 oficiais EDB foram obtidos fora do Git. Binários locais: `C:\Users\alexandre\AppData\Local\SAP-Codigos-Migration-Tools\postgres16\pgsql\bin`. Os scripts exigem pg_dump 16.x e verificam SHA-256 antes de reutilizar/restaurar arquivos.

Credenciais são lidas dos Fly secrets apenas em memória. Senhas vão para stdin de fly secrets import ou ambiente do subprocesso libpq, nunca argumentos, histórico do terminal ou arquivos de configuração. SQL de criação de role é executado com logging/monitoramento de texto de consulta desligados. Não usar fly secrets set com valores literais nem imprimir DATABASE_URL.

## Backup lógico da produção

No PowerShell, a partir de `C:\Git\SAP-Codifica-ao`:

```powershell
$env:PG_BIN_DIR = Join-Path $env:LOCALAPPDATA 'SAP-Codigos-Migration-Tools\postgres16\pgsql\bin'
$sapBackupDir = Join-Path $env:LOCALAPPDATA ('SAP-Codigos-Backups\manual-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
node scripts/migration-target.mjs backup $sapBackupDir
```

Alternativa diária, idempotente por data UTC:

```powershell
node scripts/migration-backup-daily.mjs
```

O script diário salva dump, schema, perfil e manifesto em `daily\AAAA-MM-DD` e um job-AAAA-MM-DD.json com sucesso/falha. Foi executado com sucesso em 15/09/2026. **Não foi instalado agendamento Windows ou serviço externo**: o operador deve executar diariamente ou configurar uma automação apropriada. O computador precisa estar ligado, autenticado no flyctl e conectado à rede; uma cópia off-site criptografada é recomendada. Não se deve confundir esse script manual com backup lógico automático 24 horas.

Cada execução nova usa snapshot consistente compartilhado entre dump/schema/perfil, gerando:

- database.dump (custom);
- schema.sql legível;
- profile.json (catálogos e checksums canônicos, sem linhas de usuários);
- manifest.json (versão, contagens e hashes dos arquivos).

A reutilização de uma pasta existente verifica os checksums e não substitui backups. Para capturar gravações novas no mesmo dia, use uma pasta manual com timestamp. Não existe remoção automática de backups locais.

## Snapshots do Fly

Volume com scheduled snapshots habilitados, retenção de 7 dias. Snapshot manual verificado: `vs_44L9OaOMl3mtkAwKe2kypQ6`, criado em 15/09/2026 14:29:36 UTC, estado created, aproximadamente 140 MB de dados de snapshot. A política não substitui backups lógicos externos ou disponibilidade redundante.

Snapshot final após alinhamento/reindexação: `vs_xJ49wow6MRGSaNPoPARkmGV`, estado created em 15/09/2026 14:42:43 UTC, 78.724.519 bytes, retenção 7 dias. Esse checkpoint já contém a configuração de collation final 2.41.

```powershell
flyctl volumes snapshots list vol_vjyqoddddne8ooxv -a sap-codigos-postgres-economico
flyctl volumes snapshots create vol_vjyqoddddne8ooxv -a sap-codigos-postgres-economico
```

Snapshots podem ser cobrados pela utilização organizacional total; verificar o painel. PostgreSQL permanece ligado, sem autostop e com restart always. O volume continua cobrado com a Machine parada.

## Restauração de teste

O script permite apenas nomes de banco previamente verificados e não executa DROP, clean ou sobrescrita de bancos existentes. Cria um banco vazio, prepara owners/roles independentes e restaura em transação única; se já existem tabelas, compara em vez de sobrescrever.

```powershell
$env:PG_BIN_DIR = Join-Path $env:LOCALAPPDATA 'SAP-Codigos-Migration-Tools\postgres16\pgsql\bin'
$sapBackupDir = Join-Path $env:LOCALAPPDATA 'SAP-Codigos-Backups\migration-20260915-new-production'
node scripts/migration-target.mjs restore $sapBackupDir sap_restore_verify_20260915
```

Esse comando passou, com 100% de correspondência e sequência pronta para ID 29. Para um backup de outra data, usar outro banco temporário vazio exige cadastrar seu nome exato na allowlist do script antes de executar; nunca reaproveitar fly-db com clean/drop. A produção não deve ser sobrescrita por uma restauração de teste.

Para recuperar em novo servidor/volume após perda do banco, criar infraestrutura independente com `infra/postgres/Dockerfile` e as mesmas extensões, restaurar o backup em banco vazio, validar todos os checks, e só então trocar DATABASE_URL pelo stdin/Fly secrets. Uma recuperação destrutiva do volume ou banco atual exige identificação dos alvos e autorização específica.

## Backups da migração

| Backup | Pasta fora do Git | SHA-256 database.dump |
| --- | --- | --- |
| Inicial antigo | migration-20260915-initial | d9f13a3638d816b63d00773633e42d15df4334e334dc76d5fbba8fbfff6c0635 |
| Final antigo, somente leitura | migration-20260915-final | fea975a24af7443c1c86d5f6bbf73c387432c5d732cf8705cb876d727cbffef5 |
| Nova produção | migration-20260915-new-production | c501fdefbd158e0a880658df95323639ac5213073f1c3f77022cdfa3fa7276a6 |
| Nova produção final, base alinhada | migration-20260915-new-production-final | bcf79689cc380c9f265bce5167fb437d2cbd13d0c32713eb2706bbdb9dbba1c6 |
| Diário de 15/09 | daily/2026-09-15 | 7355b6f4686339bcd087bc10ac870a85f1dc6e2126aebe5a3bdd94875ace040e |

Para o backup final antigo: schema.sql SHA-256 `1f4d9648566878ead7b98f40a2071843b51c81f357bc920fe96cf9fb4f32b3c7`; profile.json `759d3252168b3ac0d6e27810dde87ff24600ffbf6567259d43173705b9c9a222`.

Arquivos de dumps diferentes podem ter hashes diferentes por metadados/identificadores da exportação, mesmo com o mesmo perfil lógico. Os perfis finais correspondem ao SHA canônico documentado no relatório da comparação. Manifestos originais protegidos contêm todos os hashes. O backup final novo foi efetivamente restaurado em sap_restore_final_20260915, criado vazio, após o alinhamento para trixie/libc 2.41. Para esse backup, schema.sql SHA-256 = d16b70ab4c52544bca096eb97b09a0d4dafd2069f86c688b58772aeb5cf3a469.

Em recuperação por snapshot físico anterior ao alinhamento de libc, verificar versão de collation e reconstruir índices antes de REFRESH COLLATION VERSION. Não atualizar somente o número da versão. Backups lógicos restaurados na imagem final constroem seus índices com a biblioteca final.
