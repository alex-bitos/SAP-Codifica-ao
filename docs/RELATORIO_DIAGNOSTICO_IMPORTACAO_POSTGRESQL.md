# Relatório de diagnóstico da importação e persistência PostgreSQL

Data da revisão: 14/09/2026

## Resultado executivo

A aplicação já utilizava PostgreSQL como armazenamento permanente, mas dois defeitos faziam o comportamento parecer incorreto:

1. A tentativa de confirmar novamente um arquivo já importado era corretamente bloqueada pelo hash, porém o bloqueio era lançado como `Error` comum. O middleware classificava a ocorrência como HTTP 500 e escondia a causa com “Erro interno do servidor”.
2. A geração de alguns Produtos Acabados, especialmente MaxiMesh, procurava referências pelo nome literal da característica. Na V3.11, a característica `Dimensão MaxiMesh` usa o grupo `Diâmetro Mesh`, e o valor informado pode ser atendido por uma faixa dimensional. A falta dessa resolução impedia a geração apesar de a referência existir no PostgreSQL.

As duas causas foram corrigidas e validadas em PostgreSQL local descartável, com o Excel original, duas contas de usuário, reinício real do backend e testes de interface. Durante o diagnóstico, produção foi acessada somente para leitura. Depois da autorização explícita, foi gerado um backup completo e a correção foi implantada sem nova migração ou alteração de dados.

## Rastreamento dos erros

### Reimportação

- Arquivo e função originais: `src/services/importer.ts`, `importWorkbook`.
- Linha na revisão anterior: 146, expressão `throw new Error('Este arquivo já foi importado...')`.
- Etapa: verificação de idempotência, já dentro da transação.
- Evidência em produção: dois registros de log em 14/09/2026, às 16:46:57Z e 16:53:55Z, com “Este arquivo já foi importado; operação idempotente bloqueada.” apresentados como erro interno.
- Efeito nos dados: nenhum. A transação era revertida, mas a resposta HTTP 500 dava uma mensagem enganosa.
- Correção atual: resposta HTTP 409, código `IMPORT_ALREADY_COMPLETED`, etapa, situação anterior, `rolledBack: true` e `dataWritten: false`.

### MaxiMesh

- Arquivo e função originais: `src/services/codes.ts`, `prepare`; linhas 72–73 na revisão anterior.
- Etapa: resolução das características antes da reserva do sequencial.
- Causa: busca literal por `Material da Malha` e `Dimensão MaxiMesh`, sem mapear a segunda para `Diâmetro Mesh`, sem reconhecer a origem real do campo `dimensão` e sem aceitar a referência de faixa que contém 1500 mm.
- Correção atual: `src/domain/reference-resolution.ts` centraliza aliases de campo, grupo e faixa; `src/services/codes.ts` usa essa resolução antes de gerar o prefixo.
- Nova falha controlada: quando a referência realmente não existe, a API retorna HTTP 422 `REFERENCE_MISSING`, informando categoria, campo, grupo, descrição procurada, rollback e ausência de gravação.

## Arquivo analisado

Arquivo: `Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx`

SHA-256: `d60fd06eed8e3c463038830758783ab679a086f3f2e8ec95f36be6a8ea215cb7`

| Verificação | Resultado |
| --- | --- |
| Arquivo recebido pela API | Aprovado |
| Abas reconhecidas | `Codigos`, `Categorias`, `Referencias`, `Historico` |
| Cabeçalhos obrigatórios | Aprovado |
| Acentos e nomes normalizados | Aprovado |
| Valores em branco | Preservados como texto vazio quando o esquema exige `NOT NULL`; não convertidos arbitrariamente em zero |
| Códigos de referência vazios | Importados sem inventar código técnico; não podem compor um novo código |
| Duplicidades canônicas de código | 0 |
| Duplicidades de chave técnica | 0 |
| Referências semanticamente mescláveis | 24 |
| Avisos de legado | 198 DVs históricos armazenados vazios e 705 códigos legados preservados exatamente |

## Estrutura PostgreSQL

A migração `001_initial.sql` cria as tabelas abaixo e as restrições de integridade correspondentes:

| Tabela | Finalidade |
| --- | --- |
| `schema_migrations` | versões aplicadas |
| `users` | usuários e perfis |
| `sessions` | sessões e CSRF |
| `natures` | naturezas de material/serviço |
| `categories` | configuração versionada das categorias |
| `technical_references` | grupos, descrições e códigos técnicos |
| `sequential_counters` | último sequencial por prefixo estrutural |
| `sap_codes` | códigos históricos e gerados |
| `audit_log` | trilha por usuário e entidade |
| `database_imports` | arquivo, hash, estado, resumo e responsável |

Migrações verificadas em ambiente local e já registradas no banco de produção consultado somente para leitura:

| Versão | Conteúdo | Situação observada em produção |
| --- | --- | --- |
| `001_initial.sql` | esquema, restrições, índices e 12 naturezas | aplicada em 14/09/2026 15:36:32Z |
| `002_v311_category_parity.sql` | paridade de categorias V3.11 por `UPDATE`/`INSERT` idempotente | aplicada em 14/09/2026 19:48:46Z |
| `003_v311_reference_parity.sql` | paridade das referências V3.11 sem alterar códigos históricos | aplicada em 14/09/2026 19:48:46Z |
| `004_v311_reference_activation_parity.sql` | desativa aliases redundantes sem excluir registros | aplicada em 14/09/2026 19:52:36Z |

## Quantidades

### Excel e banco local limpo

| Entidade | Excel bruto | PostgreSQL após importação | Observação |
| --- | ---: | ---: | --- |
| Naturezas | — | 12 | carga estrutural versionada |
| Categorias | 145 | 147 | duas configurações derivadas/versionadas da V3.11 |
| Referências | 604 | 574 ativas | aliases/duplicidades semânticas normalizados; nada arbitrário foi criado |
| Códigos | 986 | 986 | preservação integral |
| Histórico legado | 5 | 5 | gravado na auditoria |
| Importações concluídas | — | 1 | hash único |

Estado do banco local depois da homologação visual: 1.013 códigos, 147 categorias, 574 referências ativas e uma importação concluída. O acréscimo de 27 códigos corresponde a 5 registros da homologação concorrente, 11 gerações individuais e 11 gerações em lote.

### Produção — consulta somente leitura

| Tabela | Registros observados |
| --- | ---: |
| `users` | 1 |
| `sessions` | 1 |
| `natures` | 12 |
| `categories` | 147 |
| `technical_references` | 606 totais |
| `sequential_counters` | 81 |
| `sap_codes` | 986 |
| `audit_log` | 22 |
| `database_imports` | 1 |
| `schema_migrations` | 4 |

A diferença entre as 606 referências totais de produção e as 574 referências efetivas da V3.11 é compatível com a preservação de aliases inativos e opções adicionais: as migrações de paridade desativam redundâncias, não apagam registros. A importação concluída em produção preserva 986 códigos, 145 linhas de categoria, 604 linhas brutas de referência e 5 históricos.

## Correções implementadas

- Erros de domínio tipados em `src/errors.ts`.
- Importação com validação prévia, hash, transação única e respostas específicas: `IMPORT_VALIDATION_FAILED`, `IMPORT_HASH_MISMATCH`, `IMPORT_CONFLICTS`, `IMPORT_ALREADY_COMPLETED` e `IMPORT_TRANSACTION_FAILED`.
- Rollback integral documentado por `rolledBack` e `dataWritten`.
- Log de backend com UUID de correlação, etapa, pilha e causa, sem corpo de requisição, senha, token ou `DATABASE_URL`.
- Resposta segura ao usuário para erros 500 e detalhes úteis somente em erros 4xx.
- Endpoint autenticado `GET /api/database/status` com conexão, inicialização, contagens, última importação, responsável e última auditoria.
- Indicador administrativo na tela “Importação e auditoria”.
- Aviso de banco vazio: “O banco central ainda não foi inicializado. Solicite que um Administrador realize a importação inicial.”
- Catálogos e códigos carregados automaticamente do PostgreSQL após login, sem pedir planilha a usuário comum.
- Resolução compartilhada de grupos/características e faixas dimensionais para API e frontend.
- Transações `SERIALIZABLE` com até 20 tentativas, backoff e jitter para disputas reais de sequencial.

## Testes de importação e persistência

| Cenário | Resultado |
| --- | --- |
| Importação do Excel em esquema vazio | Aprovado; 986 códigos e uma importação concluída |
| Prévia do mesmo arquivo | Aprovado; zero inclusões em códigos, categorias, referências e histórico |
| Confirmação repetida | Aprovado; HTTP 409, sem escrita |
| Histórico após reimportação | Aprovado; digest SHA-256 inalterado |
| Falha induzida após início da transação | Aprovado; categorias, códigos, importações e auditorias voltaram às contagens anteriores |
| Encerrar e recriar todas as conexões do pool | Aprovado; 986/147/574 mantidos |
| Reiniciar o processo real do backend | Aprovado; `/health=ok`, `/ready=ready` e 1.013 códigos mantidos |
| Login de segundo usuário após reinício | Aprovado; interface exibiu os mesmos 1.013 registros |
| Duas gerações simultâneas | Aprovado; códigos e sequenciais distintos |
| Corrida de duplicidade | Aprovado; uma gravação e um bloqueio |

## Estado de implantação

A correção foi implantada em 14/09/2026, depois da autorização explícita:

- banco identificado: Managed Postgres `sap-codigos-db`, banco lógico `fly-db`;
- backup completo `20260914-211413F`, status `completed`;
- commit implantado: `07f5247bf6a35eb622d4994717da520e031df9e3`;
- release Fly.io: versão 12, status `complete`;
- release command: quatro migrações verificadas, nenhuma nova migração aplicada;
- health checks: 2 de 2 aprovados;
- smoke test externo: `/health` retornou `ok` e `/ready` retornou `ready`;
- contagens pós-deploy: 12 naturezas, 147 categorias, 606 referências totais, 986 códigos, 81 contadores, uma importação e quatro migrações.

As contagens operacionais permaneceram iguais às observadas antes do deploy. O banco não foi reinicializado, apagado ou substituído.
