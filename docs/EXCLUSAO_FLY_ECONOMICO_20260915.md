# Exclusão autorizada e conferência final — 15/09/2026

Atualizado às 15:06 UTC (12:06 Brasília). Produção: https://sap-codigos-economico.fly.dev.

## Autorização e segurança

O responsável respondeu “autorizo” à exclusão dos recursos antigos e depois solicitou execução imediata. Após pergunta específica sobre dispensa expressa das 72 horas, respondeu “sim confimado”. A dispensa foi registrada às 15:03:55 UTC, antes dos comandos destrutivos. Não houve ampliação do escopo. Nenhuma credencial foi incluída neste relatório, nos argumentos dos comandos ou no Git.

O inventário imediatamente anterior confirmou somente a web antiga e o anexo histórico sap-codigos-audit-v311-20260914 no MPG. O anexo histórico foi reconsultado e não existe como app ativo. A web nova foi confirmada conectada ao PostgreSQL novo pela rede privada, banco fly-db, usuário efetivo schema_admin, 986 códigos e 3 usuários. A referência controle-soldagem-postgres foi somente consultada, sem alterações.

## Backups finais e restaurações

Raiz protegida, fora do Git: `C:\Users\alexandre\AppData\Local\SAP-Codigos-Backups`. ACL restrita ao usuário atual. PostgreSQL e clientes 16.15.

| Backup | Antigo | Nova produção |
| --- | --- | --- |
| Diretório | deletion-20260915-150217-old | deletion-20260915-150217-new |
| Criação UTC | 15:02:35.100 | 15:02:43.415 |
| Dump SHA-256 | e9fc8fed2826a06fdda08b3ff6e7c008d6470464b85f765602d66cadcd7267e8 | 01808f3f160882ce318032d657586a78dea179c5b11a31fa780dfd92b16e2e64 |
| Esquema SHA-256 | e56250d409ea67feafd9ebfde2789b5a4640b28b7cfa387b2efd035a16ed8ee5 | b9344791bbe56c7157bc0700b98e464e44b794e1c6327cbcccfac2db469d1c83 |
| Arquivo profile.json SHA-256 | 759d3252168b3ac0d6e27810dde87ff24600ffbf6567259d43173705b9c9a222 | 759d3252168b3ac0d6e27810dde87ff24600ffbf6567259d43173705b9c9a222 |
| Entradas no arquivo custom | 67 | 67 |
| Restauração efetiva em banco novo | sap_restore_deletion_old_20260915 | sap_restore_deletion_new_20260915 |
| Comparação da restauração | 100%, divergências vazias | 100%, divergências vazias |

Hash integral dos perfis, antigo, novo e duas restaurações: `6b0b88aa91138b2e410a737fe2e60d87d7f8e7ac11c8b250a3f204866fff134d`. A comparação ao vivo dos dois bancos antes da exclusão também passou. Auditoria: máximo 28, sequência 28/is_called=true, próximo 29. Nenhum dado foi sobrescrito na produção.

Contagens preservadas: audit_log 28, categories 147, database_imports 1, natures 12, sap_codes 986, schema_migrations 4, sequential_counters 81, sessions 1, technical_references 610, users 3. Nenhuma coluna de negócio foi excluída da comparação.

## Comandos destrutivos executados e comprovantes

Somente estes dois comandos foram executados:

```powershell
flyctl mpg destroy dzx6qo65n3g0jpv5 --yes
flyctl apps destroy sap-codigos-multiusuario --yes
```

- MPG respondeu: `Managed Postgres cluster sap-codigos-db (dzx6qo65n3g0jpv5) scheduled to be destroyed (may take some time)`, exit 0. Consulta posterior confirmou **status deleted**, ID interno fly-mpg-wccyph75x1tw7ljj, sem apps anexados. Lista de clusters ativos da organização digital-clarksolutions vazia; o alvo consta apenas na lista `--deleted`.
- Web respondeu: `Destroyed app sap-codigos-multiusuario`, exit 0. Lista de apps não contém mais esse app. Consultas de Machines, IPs e volumes retornam app not found. Machine antiga e82d1e90a4ed08 e alocações IPv4 compartilhado 66.241.125.54/IPv6 2a09:8280:1::18e:192f:0 pertenciam ao app destruído. A web não tinha volumes, IPv4 dedicado nem certificados personalizados.
- A consulta de backups do cluster excluído **ainda retorna 27 registros completed**. Os IDs estão preservados no [inventário de exclusão](MIGRACAO_FLY_ECONOMICO_STATUS.md). Isso não prova que cópias físicas continuam recuperáveis, nem prova que foram apagadas: a retenção/purga e eventual cobrança residual desses registros não foram confirmadas. O flyctl disponível não oferece comando separado de exclusão de backup MPG. Não executar comandos de outros serviços para tentar eliminá-los; confirmar a situação no painel/provedor.

O banco gerenciado antigo e a web antiga não podem ser reativados como os mesmos recursos. O endereço antigo e seu redirecionamento deixaram de funcionar. Os dumps externos continuam preservados e com restauração comprovada. Não depender dos registros de backup MPG ainda visíveis para recuperação.

## Recursos SAP que permanecem

| Recurso | Estado verificado |
| --- | --- |
| Web sap-codigos-economico | Machine e82d1300f47028, gru, 1 CPU compartilhada/512 MB, 2/2 checks passing |
| PostgreSQL sap-codigos-postgres-economico | Machine 28743d9c542408, gru, 1 CPU compartilhada/256 MB, 1/1 check passing |
| Volume novo | vol_vjyqoddddne8ooxv, sap_pg_data, 1 GB criptografado, /data, anexado à Machine PG |
| IPs da web nova | IPv4 compartilhado 66.241.125.46; IPv6 2a09:8280:1::18f:348a:0 |
| IPs públicos do banco novo | nenhum |
| Snapshots do volume novo | vs_44L9OaOMl3mtkAwKe2kypQ6 e vs_xJ49wow6MRGSaNPoPARkmGV, total 209 MiB, retenção 7 dias |

O banco não tem autostop. A web tem autostop por inatividade e autostart ao acesso. Há bancos de teste/restauração no mesmo volume, sem Machines extras: sap_migration_test, sap_restore_verify_20260915, sap_restore_final_20260915, sap_restore_deletion_old_20260915 e sap_restore_deletion_new_20260915. Não são a produção nem substituem o backup externo.

A referência controle-soldagem-postgres, Machine 4d891e255a2918 e volume vol_re1dezyxm9o5nw54 permaneceram intactos, 3/3 checks passing na consulta. Nenhum outro app listado na organização foi alterado ou excluído.

## Verificação após exclusão

Smoke de produção aprovado às 15:05:29.605 UTC: frontend/HTTPS/health/readiness, consulta dos 986 códigos, catálogos 147/610, permissões de administrador e capacidade de abrir transação pela role da aplicação. Sessões temporárias foram removidas; nenhum usuário ou dado original foi alterado. Hash integral permaneceu igual ao backup final. A conexão real da web foi verificada novamente no host sap-codigos-postgres-economico.internal/fly-db, schema_admin, 986 códigos e 3 usuários.

Suíte local nesta etapa: 30 testes passaram; 10 integrações ficaram skipped por ausência de TEST_DATABASE_URL nessa invocação. As 10 integrações reais PostgreSQL já passaram separadamente na imagem final antes da exclusão; não contar os skips como aprovação adicional. Nesta etapa, ambos os novos dumps tiveram restauração efetiva e comparação integral aprovadas. Scripts alterados somente para permitir os dois bancos de ensaio explicitamente autorizados e executar o smoke sem esperar o redirecionamento da web excluída; nenhuma regra de negócio foi modificada.

## Custos e faturamento — pendência explícita

O recurso que originava cerca de US$ 40 foi removido: MPG Basic US$ 38/mês + 10 GB de armazenamento US$ 2,80/mês. A antiga web também foi removida. O plano ativo antigo não aparece mais na lista de clusters ativos; isso comprova remoção técnica, **não confere a fatura**.

Base estimada nova para 30 dias de computação contínua em gru: web US$ 5,16 + PG US$ 3,14 + volume US$ 0,15 = **US$ 8,45/mês**, mais tráfego e armazenamento/snapshots eventualmente faturáveis. Autostop da web pode reduzir sua computação. Outros apps da organização continuam fora deste escopo e podem gerar cobrança.

Fontes verificadas em 15/09/2026: [preços Fly](https://fly.io/docs/about/pricing/), [preços e cobrança proporcional MPG](https://fly.io/docs/mpg/) e [exclusão MPG](https://fly.io/docs/flyctl/mpg-destroy/). Pode aparecer cobrança proporcional do período anterior à exclusão. Não é custo zero e não foi comprovada ausência de cobranças residuais.

**Painel autenticado de Usage/Billing não verificado**, conforme a continuação via flyctl com conferência manual previamente combinada. Para encerrar o aceite administrativo, conferir no painel: ausência de MPG ativo sap-codigos-db, consumo proporcional antigo, retenção/purga e eventual custo dos registros de backups antigos, Machines/volume/snapshots novos e cobranças de outros apps. Se houver MPG ativo ou cobrança posterior incompatível com a exclusão, contatar o suporte Fly com o ID do cluster e os comprovantes acima. Não solicitar nem publicar tokens/senhas para essa conferência.

## Recuperação e operação

Não existe mais retorno direto ao cluster antigo. Recuperação exige provisionar um recurso independente, restaurar backup externo protegido, comparar integralmente e alterar a conexão privada via Fly secrets somente após aprovação dos checks. Priorizar o dump mais recente da produção nova para não perder gravações posteriores; nunca restaurar por cima do banco de produção sem uma estratégia aprovada.

Snapshots do volume têm rotina automática de retenção de 7 dias. Backup lógico diário possui helper documentado e testado, mas **não há agendamento automático nem cópia offsite instalados**; permanece responsabilidade operacional executar diariamente ou configurar automação segura. [Procedimento de backup/restauração](BACKUP_RESTAURACAO_POSTGRES_ECONOMICO.md).
