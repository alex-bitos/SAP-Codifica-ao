# Relatório de migração V3.11

Fonte: `Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx`.

## Conteúdo e transformação oficial

| Conteúdo | Arquivo | Resultado efetivo no PostgreSQL de homologação |
| --- | ---: | ---: |
| Naturezas | 12 | 12 |
| Códigos históricos | 986 | 986 |
| Categorias | 145 | 147 |
| Referências brutas | 604 | 574 ativas |
| Históricos | 5 | 5 |

As 147 categorias resultam das 145 linhas da planilha mais Tubo como Produto Intermediário (`PITU`) e a categoria histórica inativa Recheio Randômico/Produto Intermediário (`PIRR`). As 574 referências efetivas resultam da normalização de aliases e da inativação preservadora das referências obsoletas de Flange Cover. Nenhum registro existente é apagado pelas migrações.

Os 986 códigos foram preservados exatamente, sem renumeração. Há 281 códigos com estrutura padronizada de 14 caracteres e 705 códigos legados. Os 198 dígitos verificadores históricos permanecem incorporados ao texto legado quando existentes, enquanto a coluna operacional `verification_digit` fica vazia, conforme a regra V3.11.

## Execução em ambiente isolado

O seed completo `seeds/v311-complete.json` foi aplicado no banco `sap_codigos_audit_20260914`. As migrações confirmadas foram:

1. `001_initial.sql` — estrutura, restrições e catálogos-base;
2. `002_v311_category_parity.sql` — normalização completa das 147 categorias;
3. `003_v311_reference_parity.sql` — paridade de referências e inativação sem exclusão.

A conferência direta retornou 12 naturezas, 147 categorias, 574 referências ativas, 986 códigos históricos e 5 eventos históricos. Após sete gravações funcionais de teste, os dois usuários consultaram 993 códigos. A Machine foi reiniciada e manteve os 993 registros, com 2/2 verificações de saúde aprovadas.

## Garantias do importador

- valida as quatro abas e calcula SHA-256;
- apresenta uma simulação ligada ao estado atual do banco;
- informa existentes, inclusões, bloqueios, duplicidades e inconsistências;
- repete a validação na confirmação;
- usa uma única transação;
- bloqueia repetição pelo hash;
- atualiza contadores pelo maior sequencial histórico aplicável;
- preserva códigos e históricos, sem exclusão ou recálculo.

O banco de produção não foi alterado. A execução em produção exige backup verificado e autorização explícita.
