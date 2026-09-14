# Relatório de testes — Produtos Acabados

Data da revisão: 14/09/2026

## Resultado

Foram localizadas exatamente 11 categorias ativas de natureza `Produto Acabado` na configuração V3.11/Excel. Todas foram testadas em geração individual pela API e pela interface, em um lote transacional único, por dois usuários e após reinício das conexões e do processo do backend.

Todos os códigos novos aplicáveis mantiveram 14 caracteres, sequencial de 6 algarismos e dígito verificador vazio. A regra especial do Flange Cover permaneceu fixa e não usa sequencial. Nenhum placeholder ficou na descrição e nenhuma referência foi criada automaticamente para fazer o teste passar.

## Resultado categoria por categoria

| Categoria | Base | Campos apresentados | Referências usadas no código | Código gerado pela interface | Descrição gerada | Gravação | Após reinício | Duplicidade | Situação |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chevron com Alojamento | `PACA` | material; módulo; modelo | `Material`: 316L → `I2`; `Alojamentos Chevron`: 35223184 → `23` | `PACAI223000001` | MaxiChevron com Alojamento - 316L - 35223184 3.1130 visual | Aprovada | Presente | HTTP 409 no teste de integração | Aprovada |
| Coletor | `PACO` | especificacao | Não aplicável; base + sequencial | `PACO0000000006` | Coletor - Coletor visual | Aprovada | Presente | HTTP 409 | Aprovada |
| Distribuidores | `PAFL` | especificacao | Não aplicável; base + sequencial | `PAFL0000000001` | Distribuidores - Distribuidor visual | Aprovada | Presente | HTTP 409 | Aprovada |
| FiberBed | `PAFB` | tipo; modelo; fixação; material grade; material leito; material fixações | `Tipos de FiberBed`: BD → `BD`; `Material Grade`: 316L → `I2` | `PAFBBDI2000001` | FiberBed BD SingleBed visual SRF - Grade 316L - Leito FV - Fixações 316L | Aprovada | Presente | HTTP 409 | Aprovada |
| Flange Cover | `PAFC` | modelo; material; diametro; classe; dreno | Catálogo exclusivo: EG / P4 / 020 / C1 / 0 | `PAFCEGP4020C10` | EconoGard / PVC / 2" / ANSI 150# / Sem dreno | Aprovada | Presente | HTTP 409 | Aprovada |
| Limitadores | `PALM` | especificacao | Não aplicável; base + sequencial | `PALM0000000001` | Limitadores - Limitador visual | Aprovada | Presente | HTTP 409 | Aprovada |
| MaxiMesh | `PAMM` | modelo; geometria; material malha; Material Grade; espessura; dimensão | `Material da Malha`: 304L → `I0`; `Diâmetro Mesh`: 1500, faixa → `03` | `PAMMI003000001` | MaxiMesh 326 visual Circular - Malha 304L Grade 304L - #1,52mm x 1500 | Aprovada | Presente | Bloqueada também pela interface | Aprovada |
| MaxiPac | `PARE` | modelo; material; diametro | `Material`: 316L → `I2`; `Diâmetro Mesh`: 1500, faixa → `03` | `PAREI203000001` | Recheio Estruturado MaxiPac 200X visual - 316L - Ø1500mm | Aprovada | Presente | HTTP 409 | Aprovada |
| Recheio Randomico | `PARR` | modelo; dimensão; material | `Material`: 316L → `I2`; segunda característica vazia recebe preenchimento estrutural | `PARRI200000001` | Recheio Aleatorio CMTP visual 25 316L | Aprovada | Presente | HTTP 409 | Aprovada |
| Suporte | `PASU` | especificacao | Não aplicável; base + sequencial | `PASU0000000001` | Suporte - Suporte visual | Aprovada | Presente | HTTP 409 | Aprovada |
| Vaso | `PAVA` | especificacao | Não aplicável; base + sequencial | `PAVA0000000001` | Vaso - Vaso visual | Aprovada | Presente | HTTP 409 | Aprovada |

## Configuração validada

| Categoria | Característica 1 | Característica 2 | Fórmula PostgreSQL/V3.11 |
| --- | --- | --- | --- |
| Chevron com Alojamento | Material | Dimensão Característica | Código Base + Material + Dimensão Característica + Sequencial |
| Coletor | — | — | Código Base + Sequencial |
| Distribuidores | — | — | Código Base + Sequencial |
| FiberBed | Tipo | Material Grade | Código Base + Tipo + Material Grade + Sequencial |
| Flange Cover | Modelo | Material | PAFC + Modelo(2) + Material(2) + Diâmetro(3) + Classe de Pressão(2) + Dreno(1) |
| Limitadores | — | — | Código Base + Sequencial |
| MaxiMesh | Material da Malha | Dimensão MaxiMesh | Código Base + Material da Malha + Dimensão MaxiMesh + Sequencial |
| MaxiPac | Material | Diâmetro Mesh | Código Base + Material + Diâmetro Mesh + Sequencial |
| Recheio Randomico | Material | — | Código Base + Material + Sequencial |
| Suporte | — | — | Código Base + Sequencial |
| Vaso | — | — | Código Base + Sequencial |

## Diagnóstico específico do MaxiMesh

| Verificação | Resultado |
| --- | --- |
| Natureza | `Produto Acabado` |
| Categoria existente no PostgreSQL | Sim |
| Código-base | `PAMM`, preservado |
| Campos enviados pelo frontend | `modelo`, `geometria`, `material_malha`, `material_grade`, `espessura`, `dimensao` |
| Característica 1 | `Material da Malha`, extraída do campo `material_malha` |
| Característica 2 | `Dimensão MaxiMesh`, extraída do campo `dimensao` |
| Grupo da característica 2 | `Diâmetro Mesh` |
| Opções técnicas | carregadas do catálogo PostgreSQL |
| Faixa dimensional | 1500 mm localizado na faixa oficial correspondente e codificado como `03` |
| Chave técnica | inclui natureza, categoria e atributos técnicos normalizados |
| Sequencial | inicializado/reservado na mesma transação |
| Duplicidade | bloqueada por chave técnica antes da gravação e por índice único no PostgreSQL |
| Resultado final | código `PAMMI003000001`, 14 caracteres, sequencial `000001`, DV vazio |

## Flange Cover

O teste visual encontrou e permitiu corrigir uma mistura indevida de opções genéricas nos `selects` bloqueados do Flange Cover. Os campos agora aceitam somente os grupos específicos `Flange Cover:Modelo`, `Flange Cover:Material`, `Flange Cover:Diametro`, `Flange Cover:Classe` e `Flange Cover:Dreno`. O teste automatizado confirma, por exemplo, que material genérico `301` e faixa genérica `1001 a 1500` não aparecem nesse formulário.

## Geração em lote

Um arquivo XLSX criado para homologação continha uma linha válida para cada uma das 11 categorias. A prévia não apresentou linha com erro e a confirmação gravou os 11 códigos em uma única transação. O teste de integração repetiu o cenário diretamente na API, confirmou 11 códigos únicos e preservou o digest dos 986 códigos históricos.

## Persistência e compartilhamento

- Após as gerações individuais e em lote, o PostgreSQL continha 1.013 códigos.
- A conta `audit_coder` viu os mesmos 1.013 códigos que a conta administrativa.
- O backend foi encerrado e iniciado novamente apontando para o mesmo PostgreSQL.
- Depois do reinício, a conta `audit_coder` autenticou pela interface e a contagem continuou em 1.013.
- O teste de integração também encerrou e recriou todo o pool duas vezes, preservando categorias, referências, códigos gerados e o digest histórico.

## Evidência automatizada

- `test/integration/full-review.test.ts`: importação real, reimportação, rollback, reinício, 11 categorias individuais, duplicidade em todas, lote e segundo usuário.
- `scripts/finished-products-visual-audit.mjs`: fluxo real da interface, inclusive indicador do banco, upload para prévia, MaxiMesh, lote e segundo usuário.
- `scripts/restart-persistence-check.mjs`: login por navegador depois do reinício real do backend e verificação da contagem persistida.
- `test/domain/reference-resolution.test.ts`: aliases, faixas dimensionais e isolamento do catálogo Flange Cover.

Resultado geral: **11 de 11 categorias aprovadas** em geração individual e em lote no ambiente local de homologação.
