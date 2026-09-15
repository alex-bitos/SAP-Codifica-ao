# Migração econômica SAP — produção e parada antes da exclusão

Estado em 15/09/2026: corte realizado, comparação integral e regressão aprovadas. **Nenhum recurso antigo excluído. Aceite administrativo final ainda pendente**: observação de 72 horas, autorização de exclusão e conferência autenticada de faturamento.

Nova URL: https://sap-codigos-economico.fly.dev. O endereço antigo redireciona páginas para ela; exige novo login por mudança de domínio. Excel permanece ferramenta administrativa de carga/auditoria/atualização controlada, não requisito a cada acesso.

## Infraestrutura nova ativa

| Recurso | Nome/ID/configuração |
| --- | --- |
| Web | sap-codigos-economico |
| Machine web | e82d1300f47028, gru, shared 1 CPU, 512 MB, 2/2 checks passing |
| Imagem web final | deployment-01M2JRHDKV446Q8AY41DZSQFG5 |
| IPs web | IPv4 compartilhado 66.241.125.46; IPv6 2a09:8280:1::18f:348a:0 |
| Banco | sap-codigos-postgres-economico, PostgreSQL 16.15, banco lógico fly-db |
| Machine PG | 28743d9c542408, gru, shared 1 CPU, 256 MB, check database passing |
| Imagem PG final | deployment-01M2JR2GGTX4V35FS2592K4J4B, postgres 16.15-trixie |
| Volume | vol_vjyqoddddne8ooxv, sap_pg_data, 1 GB criptografado, /data |
| PGDATA | /data/postgresql |
| Rede PG | sap-codigos-postgres-economico.internal; sem serviços ou IPs públicos |
| Secrets PG | POSTGRES_PASSWORD e SAP_APP_PASSWORD exclusivos, sem valores no Git |
| Política PG | restart always, SIGINT/30s, sem autostop |
| Política web | auto-start/stop, mínimo 0, pool 10 |
| Snapshot novo | vs_44L9OaOMl3mtkAwKe2kypQ6, retenção 7 dias |
| Snapshot final, após alinhamento | vs_xJ49wow6MRGSaNPoPARkmGV, created 14:42:43 UTC, retenção 7 dias |

O ensaio de 20 requisições simultâneas passou em 256 MB. Medição inicial após testes: aproximadamente 120 MB de memória disponível, disco /data com 65 MB usados de 974 MB. Não há réplica/HA; monitorar crescimento e ajustar memória/disco se necessário. Os bancos sap_migration_test, sap_restore_verify_20260915 e sap_restore_final_20260915 permanecem apenas para evidência/ensaio no mesmo volume, não são a produção e não criam Machines extras. Locale/charset e libc 2.41 foram alinhados ao original; dados mantiveram seu hash após REINDEX. A suíte PostgreSQL e o smoke de produção passaram novamente na imagem final.

## Evidências de dados e testes

Commit de implementação `51d4ebec6d6a2f5161181d039f2c6acf95322000`, enviado ao origin na branch `fix/persistencia-maximesh-produtos-acabados`. Deploy final pelo flyctl aprovado em 15/09/2026, Machine web atualizada às 14:47:13 UTC, 2/2 checks passando. Smoke pós-deploy aprovado às 14:50:21 UTC: HTTPS, catálogos, permissões, redirecionamento antigo e bloqueio da API antiga. Conexão real da web confirmada no host privado novo, banco fly-db, usuário efetivo schema_admin, 986 códigos e 3 usuários; nenhum dado original alterado pelo smoke.

- [Comparação dos bancos](RELATORIO_COMPARACAO_BANCOS.md): 100%, divergências vazias; 986 códigos, 147 categorias, 610 referências, 81 contadores, 3 usuários, 28 auditorias e importação preservada.
- [Resultado JSON](comparacao-bancos-20260915.json): hashes, lista integral de códigos, limites de IDs/datas e evidências.
- [Regressão](RELATORIO_TESTES_FLY_ECONOMICO.md): 30 unitários/paridade + 10 integrações PG; navegador, produtos críticos, multiusuário, concorrência, XLSX e reinício aprovados.
- [Backups](BACKUP_RESTAURACAO_POSTGRES_ECONOMICO.md): backup inicial, final e nova produção; quatro restaurações comprovadas; SHA-256 do dump final antigo `fea975a24af7443c1c86d5f6bbf73c387432c5d732cf8705cb876d727cbffef5`; dump final da nova produção `bcf79689cc380c9f265bce5167fb437d2cbd13d0c32713eb2706bbdb9dbba1c6`.
- [Rollback](PLANO_ROLLBACK_FLY_ECONOMICO.md): conectividade de retorno comprovada em manutenção, sem recuperação destrutiva; retorno após novas gravações exige reconciliação.

A única alteração no app foi uma barreira operacional, inativa por padrão, que impede requisições à API antiga antes da autenticação e redireciona somente GET/HEAD de páginas. As regras de composição/duplicidade foram mantidas. O fly.toml da raiz agora aponta à nova produção; a configuração antiga está arquivada em infra/fly.web-legado.toml para referência/rollback. O deploy novo também pode usar explicitamente `--config infra/fly.web-economico.toml`. PostgreSQL usa `--config infra/fly.postgres.toml`; utilizar `--ha=false` para não criar segunda Machine.

## Custos e faturamento

| Base mensal, USD/30 dias | Estimativa |
| --- | ---: |
| Antes: web 512 MB + MPG Basic/10 GB | 45,96 |
| Depois de remover recursos antigos: web 512 MB + PG 256 MB + volume 1 GB | 8,45 |
| Durante coexistência: antigos + novos, se ligados continuamente | 54,41 |

Os US$ 40 aproximados são compatíveis com MPG Basic US$ 38 + disco US$ 2,80. A base nova é até US$ 5,16 web + US$ 3,14 PG + US$ 0,15 volume; autostop web pode reduzir a parte de computação. Com PG 512 MB, a base nova seria US$ 10,47. Não há IPv4 dedicado; IPv6 nativo não acrescenta a tarifa de IPv4 dedicado. Tráfego e snapshots/armazenamento organizacional podem acrescentar cobrança. Outros aplicativos da organização continuam fora deste escopo.

Fontes públicas consultadas em 15/09/2026: [preços Fly](https://fly.io/docs/about/pricing/) e [Managed Postgres](https://fly.io/docs/mpg/). [Inventário/custos anteriores](MIGRACAO_ECONOMICA_INVENTARIO_CUSTOS.md).

O painel de faturamento **não foi verificado** nesta continuação via flyctl. Conforme combinado, a conferência autenticada fica manual. Dados de status com campos organizacionais Billable=false não comprovam ausência de cobrança. Não foi atingido custo zero nem economia total enquanto o MPG antigo existir; pode haver cobrança proporcional do período anterior mesmo após exclusão.

## Recursos antigos propostos para exclusão futura — NÃO EXECUTADA

| Alvo exato | Identificação e consequência |
| --- | --- |
| Cluster Managed Postgres | sap-codigos-db, ID dzx6qo65n3g0jpv5; ID interno fly-mpg-wccyph75x1tw7ljj; Basic, gru, 10 GB, banco fly-db |
| Aplicação web antiga | sap-codigos-multiusuario |
| Machine da web antiga | e82d1e90a4ed08, shared 1x/512 MB, gru |
| IPs da web antiga | IPv4 compartilhado 66.241.125.54 e IPv6 2a09:8280:1::18e:192f:0, liberados com a aplicação |
| Volumes/IPv4 dedicado antigos web | nenhum |
| Backups MPG | todos os backups administrados pertencentes exclusivamente ao cluster antigo; IDs inventariados abaixo |

O MPG não é um app Postgres autogerenciado, portanto não aparece como volume/Machine próprios na lista da web; não inventar IDs de recursos internos nem excluir outros aplicativos para tentar eliminá-lo. Anexos consultados: sap-codigos-multiusuario e sap-codigos-audit-v311-20260914 (não localizado como app ativo). Reinventariar anexos e todas as dependências antes da exclusão; se aparecer consumidor adicional, interromper e pedir nova orientação.

Excluir o cluster remove permanentemente a cópia antiga e seus backups do provedor; somente os backups externos preservados permitirão recuperação. Excluir a web antiga remove o redirecionamento: o endereço antigo deixará de funcionar. Manter esse redirecionamento é alternativa, mas sua Machine continuará potencialmente faturável e o custo esperado precisa ser recalculado.

Nunca excluir/alterar controle-soldagem-postgres, Machine 4d891e255a2918 ou volume vol_re1dezyxm9o5nw54. Esses recursos de referência foram apenas consultados.

## Janela de preservação e autorização

Janela conservadora arredondada após as verificações finais: 15/09/2026 12:00 Brasília. Preservar o antigo somente leitura até pelo menos **18/09/2026 12:00 Brasília**, e até aprovação explícita posterior. Não há exclusão automática, job de exclusão ou dispensa da janela. A preservação está configurada; não foi realizada ainda uma observação completa de 72 horas.

Antes de qualquer exclusão, repetir inventário/checks/dependências, guardar backup final novo e antigo em pastas distintas, apresentar IDs atualizados e confirmar autorização. Esta é a parada administrativa exigida pelo MD; nenhum comando de destruição foi implementado ou executado.

> Autoriza a exclusão permanente dos recursos antigos listados acima?

Uma aprovação não dispensa as 72 horas; essa dispensa exigiria declaração expressa separada. Resposta genérica como “continue” não autoriza destruição. Depois da eventual exclusão autorizada, conferir MPG, apps, Machines, volumes, IPs e snapshots e obter evidência do painel de uso/faturamento. Esses passos permanecem pendentes.

## IDs de backups MPG consultados em 15/09/2026

Todos completed; a lista mudará enquanto a política do provedor continuar ativa. Reinventariar antes da aprovação/exclusão efetiva.

```text
20260915-000242F_20260915-140216I
20260915-000242F_20260915-130020I
20260915-000242F_20260915-120115D
20260915-000242F_20260915-110214I
20260915-000242F_20260915-100123I
20260915-000242F_20260915-090153I
20260915-000242F_20260915-080102I
20260915-000242F_20260915-070346I
20260915-000242F_20260915-060415D
20260915-000242F_20260915-050343I
20260915-000242F_20260915-040044I
20260915-000242F_20260915-030047I
20260915-000242F_20260915-020044I
20260915-000242F_20260915-010246I
20260915-000242F
20260914-211413F_20260914-230202I
20260914-211413F_20260914-220124I
20260914-211413F
20260914-194642F_20260914-210127I
20260914-194642F_20260914-200153I
20260914-194642F
20260914-153422F_20260914-190016I
20260914-153422F_20260914-180117D
20260914-153422F_20260914-170136I
20260914-153422F_20260914-160053I
20260914-153422F
```
