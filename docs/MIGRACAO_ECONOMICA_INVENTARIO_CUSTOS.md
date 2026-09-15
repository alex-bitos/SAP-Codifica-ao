# Migração econômica — inventário e custo antes da criação

Inventário somente leitura: 15/09/2026. Nenhum recurso da aplicação de referência foi alterado.

## Infraestrutura anterior

| Recurso | Identificação/configuração |
| --- | --- |
| Conta flyctl | render@clarksolutions.com |
| Organização | personal (Digital ClarkSolutions); MPG identifica digital-clarksolutions |
| Web SAP | sap-codigos-multiusuario, região gru |
| Machine web | e82d1e90a4ed08, shared CPU 1x, 512 MB, release 12 |
| Imagem web | deployment-01M2GWC6QGJNRCCFAZ71B7T5TP |
| Saúde web | 2/2 checks passing |
| Volumes web | nenhum |
| IPs web | IPv4 compartilhado 66.241.125.54; IPv6 2a09:8280:1::18e:192f:0 |
| IPv4 dedicado SAP | nenhum |
| Certificados personalizados web | nenhum listado; HTTPS nativo fly.dev |
| Secret web | DATABASE_URL (somente nome consultado) |
| MPG | sap-codigos-db, cluster dzx6qo65n3g0jpv5, ready |
| MPG plano/disco/região | Basic, 10 GB, gru, 1 réplica indicada pelo CLI |
| Banco lógico | fly-db, PostgreSQL 16.15, aproximadamente 10 MB |
| Extensões | plpgsql 1.0, pgcrypto 1.3, pgaudit 16.1, pg_stat_monitor 2.3 |
| Aplicações anexadas ao MPG | sap-codigos-multiusuario; sap-codigos-audit-v311-20260914 (anexo listado, não aparece na lista de apps ativos) |
| Backups MPG | completos, diferenciais e incrementais listados como completed; último incremental observado 20260915-000242F_20260915-130020I |

Managed Postgres existe fora das Machines/volumes listados no app web. Não se deve supor que excluir ou parar a aplicação web interrompe a cobrança do cluster.

## Referência: consulta somente leitura

| Item | controle-soldagem-postgres |
| --- | --- |
| Machine | 4d891e255a2918, primary, gru |
| CPU/memória | shared 1x, 256 MB |
| Imagem | flyio/postgres-flex:18.1, v0.2.0 |
| Volume | vol_re1dezyxm9o5nw54, pg_data, 1 GB, criptografado, montado /data |
| PGDATA | /data/postgresql |
| IP | fdaa:af:206a:0:1::9, private ingress; nenhum público listado |
| Saúde | 3/3 passing (pg, role, vm) |
| Reinício | always; sem autostop do banco |
| Conexão | serviços privados pg_tls 5432/5433 |
| Shared buffers | 3200 blocos de 8 kB (~25 MB) |
| Snapshots | 5 snapshots observados, 179 MiB armazenados, retenção de 5 dias |
| Web de referência local | controle-de-soldagem-ozango, 512 MB, gru, auto-start/stop, mínimo 1 |

A nova infraestrutura SAP terá nomes, volume e credenciais próprios. A versão do SAP continuará PostgreSQL 16 para evitar uma atualização major simultânea à migração.

## Custos públicos de referência

Consulta em 15/09/2026. USD/mês de 30 dias, recursos ligados continuamente; sem considerar créditos, reservas, descontos ou outros aplicativos da organização.

| Item | Atual SAP | Proposta SAP | Referência soldagem |
| --- | ---: | ---: | ---: |
| Machine web shared 1x/512 MB em gru | 5,16 | até 5,16, com mínimo 0/auto-stop | 5,16 para a mesma classe |
| PostgreSQL | MPG Basic: 38,00 | shared 1x/256 MB: 3,14 | shared 1x/256 MB: 3,14 |
| Armazenamento do banco | 10 GB MPG: 2,80 | volume 1 GB: 0,15 | volume 1 GB: 0,15 |
| Snapshots | incluídos no plano MPG | 0,08/GB acima da franquia organizacional de 10 GB | mesma tarifa |
| IPv4 dedicado | 0 | 0 | nenhum no banco |
| Tráfego | variável | mesmo gru sem tráfego privado inter-regional; egress público variável | variável |
| Base de recursos | 45,96 | 8,45 | 8,45 para web + banco dessas classes |

Fontes: [preços de recursos Fly.io](https://fly.io/docs/about/pricing/) e [preços Managed Postgres](https://fly.io/docs/mpg/). A tarifa de egress público da América do Sul é US$ 0,04/GB. Um IPv4 dedicado, se criado futuramente, acrescenta US$ 2/mês. Volumes continuam faturáveis mesmo com Machine parada. Snapshots são incrementais e cobrados pelo armazenamento efetivo.

O valor aproximado de US$ 40 informado pelo responsável é compatível com a base do MPG (US$ 38 + US$ 2,80). O total real do painel de faturamento ainda precisa de evidência autenticada; a tabela não é uma fatura nem afirma gratuidade.

Durante a migração e as 72 horas posteriores, os recursos antigos permanecem faturáveis. Uma Machine de ensaio temporária também é proporcionalmente faturável. Se a memória PostgreSQL precisar de 512 MB após testes, a base sobe para US$ 10,47/mês.

## Disponibilidade e operação

Uma Machine PostgreSQL sem réplica é um ponto único de falha, assim como a referência solicitada. Snapshots de volume não substituem backups lógicos externos restaurados em teste. Atualizações, retenção, restauração, capacidade do disco e recuperação são responsabilidade do operador. O banco não terá auto-stop nem IP público.

## Estado

Inventário e custo preparados antes de criar recursos permanentes. A migração somente poderá avançar ao corte após restauração comprovada, comparação integral, testes e backup final. Nenhum recurso antigo pode ser excluído sem a pergunta de autorização expressa exigida no prompt.
