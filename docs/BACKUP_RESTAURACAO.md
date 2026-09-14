# Backup e restauração

## Managed Postgres

O Managed Postgres inclui backups automáticos e recuperação. Antes da produção, confirme a retenção e execute um ensaio de restauração em um cluster separado.

1. Liste o cluster com `fly mpg list` e confira o estado com `fly mpg status <CLUSTER_ID>`.
2. Consulte os comandos vigentes com `fly mpg backup --help` e `fly mpg restore --help`.
3. Restaure sempre em um novo cluster, nunca sobre o banco em uso.
4. Execute `/ready`, migrações e reconcilie contagens de `sap_codes`, `categories`, `technical_references`, `users` e `audit_log`.
5. Anexe temporariamente uma aplicação de homologação ao cluster restaurado e execute testes de consulta/geração.
6. Só altere o vínculo da produção após aprovação e janela de mudança.

Referência: `https://fly.io/docs/flyctl/mpg/`.

## Backup lógico adicional

Para uma cópia independente, conecte por proxy (`fly mpg proxy`) e use `pg_dump` em formato customizado. Armazene o arquivo criptografado fora do repositório. Restaure em banco vazio com `pg_restore`, execute `npm run migrate` e valide as contagens.

Nunca inclua a URL do banco na linha de comando versionada, em logs ou no nome do arquivo. Use variáveis de ambiente ou prompt seguro do cliente PostgreSQL.
