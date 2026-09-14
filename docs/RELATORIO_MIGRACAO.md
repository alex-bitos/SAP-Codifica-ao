# Relatório de migração

Fonte analisada: `Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx`.

## Simulação executada

| Conteúdo | Quantidade |
|---|---:|
| Códigos | 986 |
| Categorias no arquivo | 145 |
| Referências | 604 |
| Históricos | 5 |
| Conflitos canônicos | 0 |
| Códigos padronizados com 14 caracteres | 281 |
| Códigos legados preservados | 705 |

O arquivo contém 198 valores históricos no campo de dígito verificador. Na migração, o código SAP completo é preservado exatamente e a coluna operacional `verification_digit` fica vazia, conforme a V3.11. Nenhum código é renumerado ou recalculado.

O Excel contém apenas a categoria Tubo como Matéria Prima. O importador aplica as regras oficiais da V3.11 e adiciona Tubo como Produto Intermediário (`PITU`) com os mesmos campos técnicos da categoria `MPTU`. Também cria a categoria histórica inativa `PIRR` para relacionar os 15 códigos legados de Produto Intermediário / Recheio Randomico, sem disponibilizá-la para novos códigos. Portanto, o banco final terá 147 categorias após a importação inicial.

A análise é idempotente por SHA-256. A confirmação repete a validação, usa uma única transação e atualiza os contadores com o maior sufixo de seis dígitos observado em cada prefixo estrutural. Chaves técnicas ausentes nos registros legados permanecem nulas para não bloquear históricos compatíveis; todo novo código recebe uma chave e passa pela restrição única por natureza.

## Estado da execução

A estrutura e o conteúdo do arquivo real foram validados automaticamente. A gravação no PostgreSQL não foi executada nesta estação porque não há servidor PostgreSQL/Docker disponível e nenhuma `DATABASE_URL` foi fornecida. Execute o teste integrado e a importação confirmada em um banco vazio antes da implantação.
