# Comparação integral dos bancos — Fly econômico

Resultado em 15/09/2026: **100% de correspondência; divergências: `[]`**.

Origem: `sap-codigos-db`, cluster `dzx6qo65n3g0jpv5`, banco `fly-db`. Destino: `sap-codigos-postgres-economico`, banco `fly-db`. A aplicação nova usa a rede privada `.internal`.

## Método e evidências

O backup customizado e a exportação do esquema foram feitos com `pg_dump 16.15`, usando o mesmo snapshot exportado por uma transação REPEATABLE READ READ ONLY. Os registros de cada tabela foram convertidos para JSON canônico, com chaves ordenadas recursivamente e linhas ordenadas antes do SHA-256. Nenhuma coluna das tabelas de negócio foi excluída, incluindo hashes de senha, sessões, timestamps e auditoria; os valores de hashes de senha não aparecem neste relatório ou no JSON publicado.

O perfil final antigo, o perfil restaurado e os dois bancos consultados diretamente produziram o mesmo SHA-256:

`6b0b88aa91138b2e410a737fe2e60d87d7f8e7ac11c8b250a3f204866fff134d`

Uma comparação adicional dos bancos vivos passou às 14:31:45 UTC, após o corte e o reinício final do PostgreSQL. Novas gravações legítimas posteriores ao corte naturalmente deixarão o banco antigo desatualizado; ele não deve voltar a receber escrita sem reconciliação.

Resultado estruturado: [comparacao-bancos-20260915.json](comparacao-bancos-20260915.json), incluindo hashes por tabela, limites de IDs/datas, distribuição, lista integral dos 986 códigos, perfis, duplicidades, backups e evidências de regressão.

## Dados preservados

| Tabela | Antigo | Novo | SHA canônico igual |
| --- | ---: | ---: | --- |
| audit_log | 28 | 28 | sim |
| categories | 147 | 147 | sim |
| database_imports | 1 | 1 | sim |
| natures | 12 | 12 | sim |
| sap_codes | 986 | 986 | sim |
| schema_migrations | 4 | 4 | sim |
| sequential_counters | 81 | 81 | sim |
| sessions | 1 | 1 | sim |
| technical_references | 610 | 610 | sim |
| users | 3 | 3 | sim |

Os três usuários originais têm perfil Administrador; seus perfis, hashes, exigência de troca de senha e demais atributos foram preservados. Codificador e Consulta foram testados com contas descartáveis apenas no banco de ensaio. As referências inativas também foram preservadas. Códigos históricos curtos ou com formato antigo não foram renumerados.

Duplicidades canônicas: 0. Duplicidades de identidade técnica ativa: 0, tanto no antigo quanto no novo.

## Estruturas preservadas

| Verificação | Quantidade | Resultado |
| --- | ---: | --- |
| Schema de usuário e suas ACLs | 1 | igual |
| Relações information_schema (10 tabelas + 1 view) | 11 | iguais |
| Colunas, tipos, defaults, nulabilidade e identidade | 170 | iguais |
| Constraints, PKs, FKs e demais regras | 36 | iguais |
| Índices | 28 | iguais |
| Funções/procedimentos públicos, incluindo extensões | 52 | iguais |
| View e definição | 1 | igual |
| Triggers de usuário | 0 | iguais |
| Extensões e versões | 4 | iguais |
| Sequências e atributos | 1 | iguais |
| Owners/ACLs de relações | 12 | iguais |

Extensões: `plpgsql 1.0`, `pgcrypto 1.3`, `pgaudit 16.1`, `pg_stat_monitor 2.3`. A view operacional de estatísticas de consultas tem sua definição preservada; seus resultados em memória não são dados persistentes de negócio e não são exportados pelo pg_dump. O monitoramento de texto de consultas foi desativado no novo servidor para impedir a retenção de SQL de credenciais. Nenhum dado das 10 tabelas foi ignorado por volatilidade.

O PostgreSQL continua 16.15. A base final usa postgres:16.15-trixie: versão Debian/compilador e configuração de texto foram alinhados ao original. Tamanho físico de arquivos e endereço de servidor diferem porque a infraestrutura foi substituída; não são divergências de esquema/dados. Roles operacionais do provedor não foram copiadas com suas credenciais. `schema_admin`, `reader`, `writer` e a credencial exclusiva `sap_app` foram preparados no destino; os owners e ACLs de objetos foram preservados. A role antiga foi deliberadamente limitada a Reader para cumprir a observação sem escrita.

A verificação adicional encontrou libc 2.36 na primeira imagem bookworm versus 2.41 no antigo. Isso foi resolvido com imagem trixie, REINDEX dos bancos novos e REFRESH COLLATION VERSION somente depois de reconstruir os índices, conforme [documentação PostgreSQL](https://www.postgresql.org/docs/16/sql-altercollation.html). Charset UTF8, locale en_US.utf8, provider libc e versão armazenada/real 2.41 agora são iguais. O hash lógico permaneceu inalterado antes/depois. Nenhuma versão discrepante foi aceita como divergência de negócio.

No destino, schema_admin/writer têm pg_read_all_data e pg_write_all_data; reader tem pg_read_all_data. A credencial exclusiva sap_app possui schema_admin e role=schema_admin, reproduzindo a identidade efetiva original e mantendo owners/backup corretos em futuras migrações. Não foram copiadas senhas ou roles internos de replicação/monitoramento do provedor.

## Sequências

`audit_log_id_seq`: last_value = 28, is_called = true, maior audit_log.id = 28; próximo valor = 29. A restauração preservou o estado correto e não foi necessário resetá-lo. O verificador impede o corte se a sequência ficar atrás dos IDs existentes. Os 81 contadores de negócio foram restaurados sem alteração; geração e concorrência foram validadas no clone.

O cálculo auxiliar de mínimos/máximos foi corrigido para agregar IDs numéricos numericamente e UUIDs textualmente. A comparação final usa esse cálculo; os dados e hashes de linhas não foram alterados.

## Restaurações comprovadas

1. Backup inicial antigo → `sap_migration_test`: aprovado, antes de qualquer troca de produção.
2. Backup final antigo → novo `fly-db`: aprovado, com todos os checks ampliados acima.
3. Backup da nova produção → `sap_restore_verify_20260915`: aprovado, incluindo estado da sequência.
4. Backup final da nova produção, após alinhamento → `sap_restore_final_20260915`: aprovado às 14:41:53 UTC, com novo banco vazio e 100% de correspondência.

Lista explícita de divergências não aprovadas: **vazia**. Nenhuma regra de negócio foi alterada durante a migração.
