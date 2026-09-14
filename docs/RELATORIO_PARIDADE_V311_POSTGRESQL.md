# Relatório de paridade V3.11 × PostgreSQL

Data da revisão: 14/09/2026

## Fontes e método

Foram comparados:

- `Gerador_e_Controle_de_Codigos_SAP_V3_11_Tubo_Produto_Intermediario.html`;
- `Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx`;
- `seeds/v311-complete.json`, gerado das fontes acima;
- migrações `001` a `004`;
- PostgreSQL local após migração e importação;
- respostas da API e componentes apresentados pelo frontend.

O teste de paridade percorre as 147 categorias e 574 referências efetivas. Ele compara campos na ordem, características, fórmulas, formatos, exemplos, códigos-base, situações e identidades normalizadas. O resultado registrado em `docs/parity-summary.json` não contém diferença de categoria nem de referência.

## Paridade de quantidades

| Conjunto | V3.11/HTML | Excel bruto | Configuração efetiva | PostgreSQL local | Resultado |
| --- | ---: | ---: | ---: | ---: | --- |
| Naturezas | 12 | — | 12 | 12 | Igual |
| Categorias padrão encontradas no HTML | 140 | — | — | — | Fonte preservada |
| Categorias consolidadas | — | 145 | 147 | 147 | Igual após duas regras derivadas/versionadas |
| Referências padrão encontradas no HTML | 603 | — | — | — | Fonte preservada |
| Referências consolidadas | — | 604 | 574 | 574 ativas | Igual após normalização semântica |
| Códigos padrão presentes no HTML | 83 | — | — | — | Fonte preservada |
| Códigos históricos consolidados | — | 986 | 986 | 986 | Igual, sem renumeração |
| Histórico | — | 5 | 5 | 5 | Igual |

As 147 categorias incluem as 145 linhas consolidadas e duas configurações derivadas de regras existentes na V3.11: Tubo de Produto Intermediário (`PITU`) e Recheio Randomico de Produto Intermediário (`PIRR`, inativo). As 574 referências efetivas preservam as opções oficiais depois da mesclagem de aliases/duplicidades; registros adicionais existentes no banco não são apagados pelas migrações.

## Produtos Acabados — comparação entre camadas

Em todas as linhas abaixo, a API leu a configuração do PostgreSQL e o frontend exibiu os campos na mesma ordem de `required_fields`. A geração individual, a consulta e o lote foram executados, não apenas inspecionados.

| Categoria | V3.11 | PostgreSQL | API | Frontend | Resultado |
| --- | --- | --- | --- | --- | --- |
| Chevron com Alojamento | `PACA`; C1 Material; C2 Dimensão Característica; campos material/módulo/modelo | Mesmos valores e formato oficial | resolve `Material` e `Alojamentos Chevron`; base + C1 + C2 + seq. | 3 campos corretos; descrição e prévia válidas | Aprovado |
| Coletor | `PACO`; sem C1/C2; especificacao; base + seq. | Igual | sequencial transacional | campo único e descrição oficial | Aprovado |
| Distribuidores | `PAFL`; sem C1/C2; especificacao; base + seq. | Igual | sequencial transacional | campo único e descrição oficial | Aprovado |
| FiberBed | `PAFB`; C1 Tipo; C2 Material Grade; 6 campos | Igual | resolve `Tipos de FiberBed` e `Material Grade` | 6 campos na ordem e opções reais | Aprovado |
| Flange Cover | `PAFC`; composição fixa 2+2+3+2+1; 5 campos | Igual | usa somente catálogo específico e não reserva seq. | 5 selects bloqueados no catálogo oficial | Aprovado |
| Limitadores | `PALM`; sem C1/C2; especificacao; base + seq. | Igual | sequencial transacional | campo único e descrição oficial | Aprovado |
| MaxiMesh | `PAMM`; C1 Material da Malha; C2 Dimensão MaxiMesh; 6 campos | Igual | mapeia dimensão para `Diâmetro Mesh`, inclusive faixa | 6 campos, opções técnicas e descrição integral | Aprovado |
| MaxiPac | `PARE`; C1 Material; C2 Diâmetro Mesh; 3 campos | Igual | resolve material e faixa de diâmetro | 3 campos e descrição integral | Aprovado |
| Recheio Randomico | `PARR`; C1 Material; 3 campos | Igual | material + preenchimento estrutural + seq. | 3 campos e descrição integral | Aprovado |
| Suporte | `PASU`; sem C1/C2; especificacao; base + seq. | Igual | sequencial transacional | campo único e descrição oficial | Aprovado |
| Vaso | `PAVA`; sem C1/C2; especificacao; base + seq. | Igual | sequencial transacional | campo único e descrição oficial | Aprovado |

### Verificação dos nove itens exigidos

| Item | V3.11 | PostgreSQL | API | Frontend | Resultado |
| --- | --- | --- | --- | --- | --- |
| Código-base | 11 bases oficiais acima | mesmas 11 bases | código começa com a base da categoria | prévia e confirmação mostraram a mesma base | 11/11 |
| Característica 1 | configuração por categoria acima | valor idêntico | fonte do atributo resolvida por alias controlado | campo correspondente marcado como participante do código | 11/11 |
| Característica 2 | configuração por categoria acima | valor idêntico | grupo especial/faixa resolvido quando aplicável | opções reais apresentadas | 11/11 |
| Fórmula | fórmulas integrais V3.11 | texto idêntico | composição executada, inclusive Flange Cover | código prévio conferido | 11/11 |
| Campos obrigatórios | ordem e nomes da V3.11 | `jsonb` idêntico | validação rejeita ausência | campos renderizados na mesma ordem | 11/11 |
| Descrição | formato integral | texto idêntico | placeholders substituídos | descrição prévia sem marcador restante | 11/11 |
| Referências | catálogos oficiais | referências ativas preservadas | grupo/descrição/código validados antes de gravar | selects e validações coerentes | 11/11 |
| Sequencial | 6 algarismos quando aplicável | `varchar(6)` + `CHECK` e contadores | transação `SERIALIZABLE` | código final confirmado | 10/10 sequenciais; Flange Cover não aplicável |
| Duplicidade | identidade técnica | índice único por natureza/chave técnica + código canônico | HTTP 409, lote revertido | mensagem de já cadastrado | 11/11 |

### MaxiMesh em detalhe

| Item | V3.11 | PostgreSQL | API | Frontend | Resultado |
| --- | --- | --- | --- | --- | --- |
| Código-base | `PAMM` | `PAMM` | prefixo `PAMM` | `PAMMI003000001` | Igual |
| Característica 1 | Material da Malha | Material da Malha | atributo `material_malha`, grupo homônimo | campo Material Malha | Igual |
| Característica 2 | Dimensão MaxiMesh | Dimensão MaxiMesh | atributo `dimensao`, grupo `Diâmetro Mesh` | campo Dimensão | Igual |
| Fórmula | Base + Material da Malha + Dimensão MaxiMesh + Sequencial | texto idêntico | `PAMM` + `I0` + `03` + `000001` | prévia de 14 caracteres | Igual |
| Campos obrigatórios | modelo; geometria; material malha; Material Grade; espessura; dimensão | `jsonb` com os 6 campos | todos validados | os 6 foram exibidos e preenchidos | Igual |
| Descrição | MaxiMesh + modelo/geometria + materiais + espessura/dimensão | formato idêntico | sem placeholder residual | “MaxiMesh 326 visual Circular - Malha 304L Grade 304L - #1,52mm x 1500” | Igual |
| Referências | Material da Malha e Diâmetro Mesh | 304L=`I0`; faixa de 1500=`03` | resolução antes da reserva do sequencial | opções carregadas do PostgreSQL | Igual |
| Sequencial | 6 algarismos | contador por prefixo `PAMMI003` | `000001` na homologação visual | mostrado no código confirmado | Igual |
| Duplicidade | chave técnica | índice por natureza + chave técnica | HTTP 409 | mensagem “já cadastrado” | Bloqueada |

## Regras versionadas e preservação

- `002_v311_category_parity.sql` aplica correções por código-base e insere configurações ausentes de maneira idempotente.
- `003_v311_reference_parity.sql` atualiza/insere referências oficiais sem tocar em `sap_codes`.
- `004_v311_reference_activation_parity.sql` desativa aliases redundantes do Flange Cover e malha; não executa `DELETE`.
- A importação usa `ON CONFLICT` para catálogos, preserva códigos canônicos existentes e possui hash único em `database_imports`.
- Os 986 códigos históricos foram comparados por quantidade, unicidade canônica e digest antes/depois de geração, lote, reimportação e reinício. O digest permaneceu igual.
- O dígito verificador histórico incompatível com a regra atual é armazenado vazio sem modificar o texto do Código SAP.

## Matriz dos 30 testes obrigatórios

| # | Teste | Resultado | Evidência principal |
| ---: | --- | --- | --- |
| 1 | Abrir sem importar novamente | Aprovado | login carregou o banco existente |
| 2 | Carregar naturezas | Aprovado | 12 naturezas via API/interface |
| 3 | Carregar categorias | Aprovado | 147 categorias |
| 4 | Mostrar códigos existentes | Aprovado | 986 após carga; 1.013 após homologação |
| 5 | Acessar com segundo usuário | Aprovado | `audit_coder` |
| 6 | Segundo usuário ver os mesmos códigos | Aprovado | total 1.013 |
| 7 | Reiniciar backend | Aprovado | processo encerrado e iniciado novamente |
| 8 | Confirmar persistência | Aprovado | total 1.013 após reinício |
| 9 | Importar Excel em banco vazio | Aprovado | teste integral com arquivo original |
| 10 | Comparar Excel com PostgreSQL | Aprovado | tabela de quantidades acima |
| 11 | Reimportar o mesmo arquivo | Aprovado | prévia executada |
| 12 | Não duplicar | Aprovado | zero inclusões; HTTP 409 na confirmação |
| 13 | Simular erro durante importação | Aprovado | workbook controlado falhou após início da transação |
| 14 | Rollback integral | Aprovado | quatro contagens idênticas antes/depois |
| 15 | Cadastrar MaxiMesh | Aprovado | código persistido |
| 16 | Confirmar prefixo `PAMM` | Aprovado | `PAMMI003000001` |
| 17 | Confirmar descrição V3.11 | Aprovado | texto integral acima |
| 18 | Sequencial de 6 algarismos | Aprovado | `000001` |
| 19 | DV vazio | Aprovado | coluna e resposta vazias |
| 20 | Duplicar MaxiMesh | Aprovado | bloqueado na interface e API |
| 21 | Confirmar bloqueio | Aprovado | nenhum novo registro |
| 22 | Testar todas as categorias | Aprovado | 11/11 |
| 23 | Geração individual | Aprovado | 11 confirmações |
| 24 | Geração em lote | Aprovado | lote único com 11 linhas |
| 25 | Confirmar diretamente no PostgreSQL | Aprovado | contagens e consultas SQL |
| 26 | Não alterar histórico | Aprovado | digest dos 986 códigos inalterado |
| 27 | Nenhuma categoria V3.11 ausente | Aprovado | diferenças de categoria = `[]` |
| 28 | Nenhuma referência necessária ausente | Aprovado | resolução de todas as características codificadoras |
| 29 | Duas gerações simultâneas | Aprovado | teste real com 20 disputas e homologação de duas contas |
| 30 | Não repetir código/sequencial | Aprovado | unicidade integral; corrida 1 gravada/1 bloqueada |

## Execuções finais

| Comando/cenário | Resultado |
| --- | --- |
| `npm run build` | Aprovado |
| `npm test` | 26 aprovados, 10 integrações ignoradas sem URL de banco no comando padrão |
| `npm run test:integration` com `TEST_DATABASE_URL` | 10 de 10 aprovados, execução serial entre arquivos |
| `npm run verify:homologation` | Aprovado: concorrência, duplicidade, lote, usuários e exportação |
| Auditoria Playwright das 11 categorias | Aprovado |
| Verificação Playwright pós-reinício | Aprovado; 1.013 de 1.013 |

## Conclusão e implantação

A paridade funcional e de dados foi demonstrada no ambiente local de homologação. Depois da autorização explícita, o backup completo `20260914-211413F` foi concluído e o commit `07f5247bf6a35eb622d4994717da520e031df9e3` foi implantado na release 12 do Fly.io. A release command verificou as quatro migrações já aplicadas, sem alteração de dados. Os dois health checks passaram e a consulta PostgreSQL pós-deploy confirmou a preservação dos 986 códigos e das demais contagens produtivas.
