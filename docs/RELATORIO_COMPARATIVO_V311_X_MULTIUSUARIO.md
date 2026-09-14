# Relatório comparativo V3.11 × versão multiusuário

Data da auditoria inicial: 14/09/2026  
Branch: `fix/auditoria-paridade-v311`  
Base auditada: commit `c829e58`  
Estado deste documento: **levantamento anterior às correções**

## Escopo e evidências

Foram inspecionados o HTML funcional `Gerador_e_Controle_de_Codigos_SAP_V3_11_Tubo_Produto_Intermediario.html`, a planilha consolidada, o frontend em `public/`, o backend em `src/`, a migração `001_initial.sql`, os testes e a configuração do Fly.io.

O banco operacional de produção foi consultado diretamente, em modo somente leitura, e não é um mock ou fallback. Evidências encontradas:

- PostgreSQL `fly-db`, usuário `schema_admin`, schema `public`;
- migração `001_initial.sql` registrada como aplicada;
- 1 usuário, 12 naturezas, 147 categorias, 601 referências técnicas, 986 códigos, 16 eventos de auditoria e 1 importação concluída;
- persistência acessada pelo backend exclusivamente pela variável `DATABASE_URL` e pelo driver PostgreSQL `pg`;
- a planilha possui 986 códigos, 145 categorias, 604 linhas de referência e 5 linhas de histórico;
- as duas categorias adicionais no PostgreSQL são Tubo/Produto Intermediário (`PITU`) e Recheio Randômico/Produto Intermediário inativo (`PIRR`).

Essas quantidades confirmam que a importação inicial foi persistida. Elas não comprovam, isoladamente, equivalência funcional com a V3.11.

## Matriz comparativa

| Área | V3.11 local | Multiusuário atual | Incongruência | Prioridade | Correção prevista |
| --- | --- | --- | --- | --- | --- |
| Naturezas | 12 naturezas carregadas do banco Excel | 12 naturezas existem no PostgreSQL | Falha da API é ocultada e a tela pode parecer vazia | Alta | Estado de erro visível, bloqueio do gerador e log sanitizado |
| Categorias | Catálogo completo com regras oficiais aplicadas | 147 registros persistidos | Importador aplica apenas parte das normalizações V3.11 | Crítica | Regra oficial única e teste exaustivo de paridade |
| Busca rápida | Busca parcial, sem acento/caixa, por categoria e natureza | Ausente | Função eliminada | Alta | Restaurar com dados recebidos da API/PostgreSQL |
| Campos dinâmicos | Só aparecem após selecionar categoria | Campos dinâmicos coexistem com bloco administrativo universal | Campos indevidos aparecem para todas as categorias | Crítica | Um único renderizador baseado nos campos da categoria |
| Campos administrativos | Integram `CamposObrigatorios` quando aplicáveis; responsável é universal | Unidade, fabricante, modelo, TAG, NCP, projeto, série e observação sempre visíveis | Regra e posição divergentes; alguns campos são duplicados | Alta | Exibir apenas os campos configurados; responsável = usuário autenticado |
| Ordem dos campos | Ordem de `CamposObrigatorios` | Ordem técnica preservada, mas administrativos ficam fora dela | Ordem final incorreta | Alta | Preservar uma lista ordenada única |
| Opções dos campos | Referências, opções globais, catálogos de mercado e especiais | Apenas referências por aproximação de grupo | Autocompletar incompleto e sem ordenação semântica | Alta | Camada de domínio versionada para opções e tipos de controle |
| Cadastro de opção | “Outro / Cadastrar nova opção” com registro no histórico | Endpoint existe, mas não há fluxo na interface | Função indisponível ao usuário | Média | Fluxo administrativo na própria entrada controlada |
| Descrição | Substitui campos e remove separadores vazios; campos administrativos não entram | Campo ausente vira texto `NA` no formato genérico | Descrições diferentes da V3.11 | Crítica | Usar o mesmo algoritmo oficial no servidor |
| Chave técnica | Natureza + categoria + campos técnicos, excluindo somente administrativos oficiais | Também exclui unidade e fabricante indiscriminadamente | Pode aceitar duplicidade ou bloquear combinações erradas | Crítica | Metadado explícito por campo e algoritmo equivalente |
| Duplicidade histórica | Compara chave técnica e descrição técnica normalizada | Códigos importados têm chave técnica nula; consulta só chave exata | Duplicata de item histórico pode ser recriada | Crítica | Comparação compatível com legado no mesmo contexto técnico |
| Sequencial | 6 dígitos; contador por estrutura | Transação serializável, contador bloqueado com `FOR UPDATE` | Arquitetura correta, mas falta comprovação completa com banco real | Alta | Teste concorrente obrigatório com dois usuários |
| Tubo MP/PI | `MPTU` e `PITU`, mesmos campos, naturezas distintas | Registros presentes | Falta teste exaustivo e renderização fiel das opções | Alta | Testes de paridade, descrição e duplicidade entre naturezas |
| Flange | Campos e validações específicas; norma não se repete | Regra parcial no servidor | Opções específicas incompletas e UI genérica | Alta | Campo configurado, catálogos e regressão de descrição |
| Pestana e Uniões | Formatos e validações específicas | Regra parcial no servidor | UI/opções não equivalentes | Alta | Paridade de configuração, validação e testes |
| Flange Cover | Código fixo formado por cinco catálogos oficiais | Formação especial implementada no servidor | Falta prova de catálogo/UI e paridade integral | Alta | Teste de todas as tabelas e controles fechados |
| Geração individual | Prévia, validação, confirmação e histórico | Fluxo equivalente básico | Herda erros de campos, descrição e duplicidade | Crítica | Corrigir regra central e testar ponta a ponta |
| Lote | Classificação detalhada de linhas e prevenção no próprio lote | Validação simplificada, confirmação tudo-ou-nada | Duplicidades internas podem só aparecer na confirmação | Alta | Detectar conflitos no lote durante a validação e detalhar status |
| Consulta e filtros | Busca e filtros do catálogo local | Busca, categoria e situação | Filtro por natureza ausente | Média | Acrescentar natureza sem remover filtros existentes |
| Importação | Leitura completa das quatro abas | Transacional, idempotente e administrativa | Prévia não mostra abas, existentes, inclusões, bloqueios e detalhes | Alta | Relatório de simulação completo antes da confirmação |
| Importação de referências | Mesclagem canônica remove grupos antigos do Flange Cover | `ON CONFLICT` por grupo/descrição literal | Pode conservar aliases obsoletos ou divergentes | Alta | Normalização/mesclagem oficial e teste de todas as referências |
| Importação de categorias | Aplica todas as regras oficiais após carregar | Aplica Tubo/Flange/Pestana/Uniões/Flange Cover | Regras de PA, Serviços, FiberBed e Bomba não são aplicadas | Crítica | Extrair regra integral e compartilhá-la com importador/testes |
| Exportação | Quatro abas no formato do banco V3.11 | Quatro abas são exportadas | Falta comparação célula/cabeçalho e round-trip | Média | Teste automatizado do arquivo exportado |
| Histórico | Registra ações e alterações | Auditoria em PostgreSQL e importação histórica | Interface mostra resumo menor que a V3.11 | Média | Ampliar detalhes preservando segurança e permissões |
| Categorias/referências | Administração completa no arquivo local | Tela web é essencialmente somente leitura | Endpoints de alteração não estão acessíveis pela UI | Média | Controles administrativos com auditoria |
| Usuários e permissões | Uso local sem separação de perfis | Administrador, Codificador e Consulta | Estrutura nova adequada, ainda sem teste funcional completo por perfil | Alta | Matriz de autorização e testes de API/UI |
| PostgreSQL | Excel é banco local | PostgreSQL central é autoridade | Funcionamento confirmado; falta ambiente isolado de teste/reinício | Alta | Banco de teste, importação, reinício e consulta direta |
| Falha de catálogo | Arquivo carregado ou erro explícito | `Promise.all` falha e o bootstrap pode voltar ao login sem explicar | Falha silenciosa e diagnóstico incorreto | Alta | Mensagem obrigatória e estado indisponível separado de autenticação |
| Validação do banco | Relatórios de conflitos canônicos e referências | Validação parcial | Diagnóstico insuficiente para aprovação administrativa | Alta | Inconsistências e contagens detalhadas |
| Testes automatizados | Comportamento embutido no artefato de referência | 10 testes passam; 2 de concorrência ficam ignorados sem banco | Não há teste de paridade, browser ou banco obrigatório | Crítica | Suíte de paridade + integração PostgreSQL + E2E |
| Testes visuais | Referência visual conhecida | Nenhuma evidência capturada nesta versão | Regressões de interface não são comprovadas | Alta | Capturas reproduzíveis dos nove cenários exigidos |
| Seeds | Catálogo integral dentro do HTML/Excel | Dados entram somente pela importação administrativa inicial | Não existe seed versionado independente e verificável | Alta | Gerar seed completo automaticamente a partir da referência |

## Incongruências numeradas

Cada item abaixo registra o comportamento **antes da correção**. As colunas “correção aplicada” e “resultado” serão atualizadas somente após implementação e teste.

### INC-001 — Busca rápida removida

- Área: seleção de categoria.
- V3.11: pesquisa parcial por categoria ou natureza, sem distinguir acentos ou maiúsculas; seleciona natureza, categoria e campos.
- Multiusuário: não possui o componente nem a rotina.
- Responsável: `public/index.html`, `public/app.js`.
- Consequência: perda de produtividade e dificuldade para categorias homônimas.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: buscas `Tubo`, `Instrumento`, `Flange`, `limpeza`, natureza e resultado inexistente.
- Resultado: pendente.

### INC-002 — Falha de catálogo tratada como falha de login

- Área: inicialização.
- V3.11: o estado do banco é apresentado ao usuário.
- Multiusuário: `bootstrap()` captura em conjunto falhas de autenticação, naturezas, categorias, referências e códigos; qualquer erro pode retornar silenciosamente à tela de login.
- Responsável: `public/app.js`.
- Consequência: Natureza/Categoria vazias ou login aparente sem diagnóstico.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: indisponibilizar a API de catálogos e verificar mensagem obrigatória.
- Resultado: pendente.

### INC-003 — Campos administrativos universais

- Área: Novo código.
- V3.11: campos aparecem pela configuração da categoria; antes disso aparece “Selecione uma categoria.”
- Multiusuário: bloco fixo de unidade, fabricante, modelo, TAG, NCP, projeto, série e observação aparece para todas as categorias.
- Responsável: `public/index.html`, `public/app.js`.
- Consequência: campos adicionais indevidos, duplicação de modelo/fabricante e ordem incorreta.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: estado inicial e todas as categorias.
- Resultado: pendente.

### INC-004 — Normalização oficial de categorias incompleta

- Área: seed/importação.
- V3.11: `applyOfficialCategoryRules()` cobre Tubo, categorias de Produto Acabado, Serviços, Flange Cover, FiberBed, Bomba e formatos especiais.
- Multiusuário: `officialCategory()` cobre somente Tubo, Flange, Pestana, duas Uniões e Flange Cover.
- Responsável: `src/services/importer.ts`.
- Consequência: código-base, campos, formato, características ou fórmula podem divergir em várias categorias.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: comparação automática de cada campo das 147 combinações efetivas.
- Resultado: pendente.

### INC-005 — Descrição genérica preenche ausências com `NA`

- Área: regra de descrição.
- V3.11: remove placeholders administrativos e limpa trechos vazios.
- Multiusuário: substitui qualquer placeholder ausente por `NA`.
- Responsável: `src/domain/code-rules.ts`.
- Consequência: descrição final incompatível com o legado.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: descrição representativa de cada categoria e placeholders administrativos.
- Resultado: pendente.

### INC-006 — Critério de chave técnica divergente

- Área: duplicidade.
- V3.11: exclui responsável, TAG, NCP, projeto e número de série da identidade técnica.
- Multiusuário: também exclui observação, unidade e fabricante de toda categoria.
- Responsável: `src/domain/code-rules.ts`.
- Consequência: falsos positivos e falsos negativos de duplicidade.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: variações administrativas e técnicas por categoria.
- Resultado: pendente.

### INC-007 — Códigos históricos sem chave técnica reutilizável

- Área: duplicidade do legado.
- V3.11: utiliza fallback por descrição técnica normalizada.
- Multiusuário: códigos do Excel entram com `technical_key = NULL`, e a criação consulta somente chave técnica exata.
- Responsável: `src/services/importer.ts`, `src/services/codes.ts`.
- Consequência: item já existente pode receber novo código.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: tentar recriar códigos históricos representativos.
- Resultado: pendente.

### INC-008 — Opções técnicas reduzidas

- Área: campos dinâmicos.
- V3.11: combina opções globais, catálogos de mercado, referências oficiais e catálogos especiais.
- Multiusuário: sugere apenas descrições de referências cujo grupo simplificado coincide.
- Responsável: `public/app.js`.
- Consequência: opções ausentes e maior risco de digitação inconsistente.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: Chapa, Tubo, Flange, Instrumento, fixadores e Flange Cover.
- Resultado: pendente.

### INC-009 — Cadastro de nova opção inacessível

- Área: referências.
- V3.11: opção “Outro / Cadastrar nova opção” cria referência e histórico.
- Multiusuário: API administrativa existe, mas nenhum controle da tela chama essa função.
- Responsável: `public/index.html`, `public/app.js`, `src/routes.ts`.
- Consequência: administração funcional incompleta.
- Prioridade: Média.
- Correção aplicada: pendente.
- Teste: administrador inclui opção; codificador a consulta; consulta não altera.
- Resultado: pendente.

### INC-010 — Metadados dos campos não são explícitos

- Área: configuração.
- V3.11: regras de opção, validação e participação são inferidas por funções consolidadas.
- Multiusuário: PostgreSQL guarda somente nomes em `required_fields`; frontend inventa comportamento por heurística.
- Responsável: `migrations/001_initial.sql`, `src/domain/`, `public/app.js`.
- Consequência: duas fontes parciais de regra e impossibilidade de provar equivalência.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: esquema/configuração de todas as categorias.
- Resultado: pendente.

### INC-011 — Referências são mescladas por literal

- Área: importação de referências.
- V3.11: normaliza grupos e elimina aliases obsoletos do Flange Cover antes da mesclagem.
- Multiusuário: conflito apenas em `(reference_group, description)` literal.
- Responsável: `src/services/importer.ts`, `migrations/001_initial.sql`.
- Consequência: duplicação semântica e opções divergentes.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: comparação automatizada de todas as referências efetivas.
- Resultado: pendente.

### INC-012 — Validação do lote não detecta todos os conflitos antecipadamente

- Área: codificação em lote.
- V3.11: classifica conflitos e reutilizações dentro do lote.
- Multiusuário: valida itens isoladamente; duplicação entre duas linhas pode aparecer somente na confirmação transacional.
- Responsável: `src/services/codes.ts`, `public/app.js`.
- Consequência: lote aparentemente válido pode falhar integralmente ao confirmar.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: duas linhas iguais, duplicidade histórica e duas naturezas distintas.
- Resultado: pendente.

### INC-013 — Relatório pré-importação insuficiente

- Área: importação administrativa.
- V3.11/requisito: abas, quantidades, duplicidades, inconsistências, inclusões, existentes e bloqueados.
- Multiusuário: mostra quatro contagens, aviso agregado e validade.
- Responsável: `src/services/importer.ts`, `public/app.js`.
- Consequência: administrador não consegue avaliar o impacto antes da confirmação.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: arquivo novo, já importado, duplicado e com aba ausente.
- Resultado: pendente.

### INC-014 — Filtro de natureza ausente na consulta

- Área: consulta.
- V3.11: contexto por natureza disponível.
- Multiusuário: filtra texto, categoria e situação, sem seletor de natureza.
- Responsável: `public/index.html`, `public/app.js`, `src/routes.ts`.
- Consequência: consulta menos precisa para categorias homônimas.
- Prioridade: Média.
- Correção aplicada: pendente.
- Teste: Tubo MP versus Tubo PI.
- Resultado: pendente.

### INC-015 — Administração web de categorias/referências incompleta

- Área: cadastros técnicos.
- V3.11: manutenção de categorias e referências disponível.
- Multiusuário: interface apenas lista; endpoints não possuem fluxo visual completo.
- Responsável: `public/index.html`, `public/app.js`.
- Consequência: manutenção exige chamada técnica externa.
- Prioridade: Média.
- Correção aplicada: pendente.
- Teste: criar/editar/inativar com auditoria e autorização.
- Resultado: pendente.

### INC-016 — Responsável não é mostrado como na referência

- Área: novo código/auditoria.
- V3.11: responsável aparece no fluxo.
- Multiusuário: autoria é obtida corretamente da sessão, mas não é apresentada no formulário.
- Responsável: `public/index.html`, `src/audit.ts`.
- Consequência: usuário não enxerga quem será registrado, embora o servidor mantenha autoridade.
- Prioridade: Baixa.
- Correção aplicada: pendente.
- Teste: nome autenticado visível e autor persistido sem aceitar adulteração do cliente.
- Resultado: pendente.

### INC-017 — Fórmula e opções de Flange/Pestana/Uniões não são provadas na UI

- Área: componentes especiais.
- V3.11: controles e validações específicos.
- Multiusuário: backend possui parte das validações, mas a UI usa entrada textual genérica.
- Responsável: `src/domain/code-rules.ts`, `public/app.js`.
- Consequência: valores tecnicamente incompatíveis chegam com mais facilidade ao servidor.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: normas de material/dimensional trocadas, face inválida e origem inválida.
- Resultado: pendente.

### INC-018 — Tubo não usa integralmente os catálogos da V3.11

- Área: Tubo MP/PI.
- V3.11: opções oficiais de norma, material, diâmetro, schedule/espessura e origem.
- Multiusuário: apenas referências aproximadas, quando disponíveis.
- Responsável: `public/app.js`.
- Consequência: comportamento diferente entre MP e PI apesar das bases corretas.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: MPTU, PITU, descrição, origem e duplicidade cruzada.
- Resultado: pendente.

### INC-019 — Testes de concorrência são opcionais na execução padrão

- Área: qualidade/concorrência.
- V3.11/requisito multiusuário: sequenciais nunca podem colidir.
- Multiusuário: existem dois testes reais, mas ficam ignorados sem `TEST_DATABASE_URL`.
- Responsável: `test/integration/concurrency.test.ts`, configuração de teste.
- Consequência: uma execução verde pode não ter testado PostgreSQL.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: banco PostgreSQL isolado obrigatório na homologação.
- Resultado: pendente.

### INC-020 — Ausência de suíte de paridade integral

- Área: qualidade.
- V3.11: fonte de verdade não é extraída pelos testes da versão web.
- Multiusuário: testes cobrem autenticação, algumas regras e importador, mas não todas as categorias/referências.
- Responsável: `test/`.
- Consequência: regressões e omissões passam despercebidas.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: extrator automático + comparação exaustiva.
- Resultado: pendente.

### INC-021 — Seeds completos não estão versionados

- Área: implantação/reprodutibilidade.
- V3.11: dados iniciais estão no HTML e na planilha.
- Multiusuário: uma instalação vazia depende de importação manual/CLI da planilha externa à imagem.
- Responsável: `Dockerfile`, `.dockerignore`, `src/cli/import-initial.ts`.
- Consequência: ambiente novo não é reprodutível apenas com migrações e código.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: criar banco vazio, migrar e semear automaticamente.
- Resultado: pendente.

### INC-022 — Estado de conexão é superficial

- Área: status operacional.
- V3.11: estado do banco local é explícito.
- Multiusuário: consulta `/ready`, mas não diferencia sessão, API e catálogo carregado.
- Responsável: `public/app.js`, `src/server.ts`.
- Consequência: “servidor conectado” pode coexistir com catálogos indisponíveis.
- Prioridade: Média.
- Correção aplicada: pendente.
- Teste: banco indisponível, sessão expirada e catálogo inválido.
- Resultado: pendente.

### INC-023 — Exportação sem teste de compatibilidade

- Área: Excel.
- V3.11: cabeçalhos e quatro abas constituem o banco portável.
- Multiusuário: exportador existe, porém não há teste de cabeçalhos, contagens e reimportação.
- Responsável: `src/services/exporter.ts`, `test/`.
- Consequência: arquivo pode parecer correto sem suportar round-trip.
- Prioridade: Média.
- Correção aplicada: pendente.
- Teste: exportar banco de teste, validar abas/células e analisar novamente.
- Resultado: pendente.

### INC-024 — Testes visuais ausentes

- Área: interface.
- V3.11: referência visual e comportamento conhecido.
- Multiusuário: não há capturas verificáveis dos cenários solicitados.
- Responsável: documentação/testes E2E.
- Consequência: regressões de composição e visibilidade não são demonstradas.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: nove capturas obrigatórias em navegador.
- Resultado: pendente.

### INC-025 — Teste funcional de segundo usuário ausente

- Área: multiusuário.
- V3.11/requisito web: usuários distintos devem compartilhar o banco central com permissões próprias.
- Multiusuário: produção possui atualmente apenas um usuário; a arquitetura suporta usuários, mas não há evidência ponta a ponta com dois.
- Responsável: `src/auth.ts`, `src/routes.ts`, `test/`.
- Consequência: critério de aceite não comprovado.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: dois usuários no banco isolado, leitura comum e geração concorrente.
- Resultado: pendente.

### INC-026 — Reinício/persistência não faz parte da suíte

- Área: PostgreSQL.
- V3.11/requisito web: códigos permanecem após reinício.
- Multiusuário: persistência foi confirmada diretamente em produção, mas não há teste automatizado de reinício no ambiente de homologação.
- Responsável: scripts de teste/implantação.
- Consequência: evidência operacional não é repetível.
- Prioridade: Alta.
- Correção aplicada: pendente.
- Teste: importar, reiniciar processo e consultar por duas sessões.
- Resultado: pendente.

### INC-027 — Interface de histórico reduz detalhes

- Área: auditoria.
- V3.11: histórico contém valor anterior, valor novo e observação.
- Multiusuário: tabela web mostra somente data, usuário, ação e entidade.
- Responsável: `public/index.html`, `public/app.js`, `src/routes.ts`.
- Consequência: rastreabilidade existe no banco, mas não é totalmente consultável pela interface.
- Prioridade: Média.
- Correção aplicada: pendente.
- Teste: criar código/opção e conferir detalhes conforme perfil.
- Resultado: pendente.

### INC-028 — Categoria pode parecer disponível sem regra íntegra

- Área: integridade funcional.
- V3.11: presença significa dados mais tratamentos especiais.
- Multiusuário: a linha da categoria existe no PostgreSQL, mas a UI só recebe campos obrigatórios e aplica heurísticas reduzidas.
- Responsável: `src/routes.ts`, `public/app.js`.
- Consequência: contagem correta mascara função incompleta.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: matriz de todas as categorias incluindo tipo de controle/opções/validação.
- Resultado: pendente.

### INC-029 — Separação entre regra do frontend e do backend

- Área: arquitetura.
- V3.11: uma implementação local concentra seleção, opções e código.
- Multiusuário: servidor gera/valida, enquanto frontend mantém heurísticas próprias para opções e grupos.
- Responsável: `src/domain/`, `public/app.js`.
- Consequência: evolução pode produzir resultados diferentes entre tela e API.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: API fornece configuração; frontend apenas renderiza; testes de contrato.
- Resultado: pendente.

### INC-030 — Ausência de relatório exaustivo por categoria e referência

- Área: auditoria.
- V3.11/requisito: cada categoria, cada campo e cada referência devem ser comparados automaticamente.
- Multiusuário: documentação anterior resume funcionalidades e migração, sem relação integral reproduzível.
- Responsável: `docs/`, `scripts/`, `test/`.
- Consequência: não é possível provar que nenhuma estrutura foi esquecida.
- Prioridade: Crítica.
- Correção aplicada: pendente.
- Teste: gerador de inventário e falha de CI diante de qualquer diferença.
- Resultado: pendente.

## Pontos já conformes ou parcialmente conformes

- O backend usa PostgreSQL real e não contém fallback para JSON, memória ou SQLite.
- A migração inicial cria tabelas, índices e restrições relevantes.
- A API é a autoridade para prévia, confirmação e duplicidade.
- O contador é atualizado em transação `SERIALIZABLE` e bloqueado com `FOR UPDATE`.
- O código canônico tem restrição única.
- Tubo MP e PI são separados por natureza e base (`MPTU`/`PITU`).
- Flange Cover possui formação fixa no domínio.
- Importação é administrativa, transacional e bloqueia reimportação pelo hash.
- Códigos históricos foram preservados sem renumeração e o dígito verificador é armazenado vazio.
- Perfis Administrador, Codificador e Consulta e proteção CSRF estão implementados.

Esses pontos serão novamente validados em banco de teste; não são considerados aprovados apenas por inspeção do código.

## Resultados após as correções

Esta seção registra o encerramento de cada item e substitui os campos “pendente” do levantamento inicial. A homologação usou o aplicativo isolado `sap-codigos-audit-v311-20260914` e o banco separado `sap_codigos_audit_20260914`; nenhuma migração ou escrita foi feita no banco de produção.

| Item | Correção aplicada | Teste utilizado | Resultado |
| --- | --- | --- | --- |
| INC-001 | Busca rápida por categoria/natureza ligada à API e ao PostgreSQL. | Paridade + browser com Tubo, Instrumento e Flange. | Aprovado; MP e PI são distinguidos e a seleção carrega os campos. |
| INC-002 | Erros de autenticação e catálogo separados; formulário corrigido para sobreviver ao `await`; quatro tentativas e bloqueio seguro. | Browser com login real e falha 503 forçada. | Aprovado; carga normal habilita os catálogos e falha mostra a mensagem obrigatória. |
| INC-003 | Bloco administrativo universal removido; somente os campos configurados são renderizados. | Teste estático, paridade de 147 categorias e captura inicial. | Aprovado; antes da seleção aparece somente “Selecione uma categoria.” |
| INC-004 | Regras integrais extraídas para `v311-category-rules.ts`. | Comparação automatizada de todos os atributos das 147 categorias. | Aprovado; zero diferenças. |
| INC-005 | Substituição de campos ausentes e limpeza de separadores equivalentes à V3.11. | Testes de descrição e placeholders. | Aprovado; nenhum `NA` artificial. |
| INC-006 | Identidade técnica alinhada aos campos administrativos oficiais. | Teste com alterações de TAG e observação técnica. | Aprovado; natureza permanece na chave. |
| INC-007 | Fallback de duplicidade por descrição técnica normalizada para legado sem chave. | Teste de domínio e verificação no serviço. | Aprovado; histórico não pode ser recriado pela mesma identidade. |
| INC-008 | Catálogos globais, especiais, de mercado e referências foram centralizados no domínio do servidor. | Paridade de campos e opções críticas no browser. | Aprovado. |
| INC-009 | Inclusão de opção disponível ao Administrador no próprio campo e persistida em referências. | Inspeção de autorização/API e fluxo browser. | Aprovado; opção aparece novamente após recarga. |
| INC-010 | Endpoint de metadados informa ordem, controle, opções, validação e participação na regra. | Teste de todas as categorias. | Aprovado; uma única camada versionada orienta servidor e tela. |
| INC-011 | Grupos e aliases de referência normalizados; referências obsoletas ficam inativas, sem exclusão. | Comparação das 574 referências efetivas. | Aprovado; zero diferenças semânticas. |
| INC-012 | Validação do lote mantém chave interna e a confirmação faz rollback integral em conflito. | Lote válido de 2 itens e lote duplicado em PostgreSQL real. | Aprovado; duplicidade bloqueada e nenhuma gravação parcial. |
| INC-013 | Simulação mostra arquivo, abas, contagens, existentes, inclusões, bloqueios, duplicidades e inconsistências. | Browser com o Excel oficial. | Aprovado. |
| INC-014 | Filtro de natureza incluído na consulta e no SQL. | Browser e consulta de categorias homônimas. | Aprovado. |
| INC-015 | Administração web ganhou criação e ativação/inativação de categorias e referências. | Inspeção de rotas, perfis e auditoria. | Aprovado para os fluxos implementados. |
| INC-016 | Responsável autenticado exibido e mantido como autoridade do servidor. | Browser com Administrador e Codificador. | Aprovado; cliente não escolhe a autoria. |
| INC-017 | Flange, Pestana e Uniões usam regras e opções oficiais. | Paridade total e cenário visual de Flange. | Aprovado. |
| INC-018 | Tubo MP (`MPTU`) e PI (`PITU`) usam os mesmos cinco campos oficiais em naturezas distintas. | Teste de paridade e busca/seleção no browser. | Aprovado. |
| INC-019 | Verificador de homologação executa concorrência real e conflito simultâneo. | Dois usuários no PostgreSQL: códigos `000003` e `000004`; uma de duas duplicatas bloqueada. | Aprovado; sequenciais únicos. |
| INC-020 | Suíte de paridade integral criada e adicionada a `npm test`. | 19 testes aprovados; 147 categorias percorridas. | Aprovado. |
| INC-021 | Seed completo e reproduzível gerado em `seeds/v311-complete.json`. | Seed em banco vazio e conferência direta. | Aprovado. |
| INC-022 | Estado de conexão separado do estado dos catálogos. | `/ready`, login real e indisponibilidade forçada. | Aprovado. |
| INC-023 | Exportação validada por leitura do XLSX resultante. | PostgreSQL real: 4 abas e 993 códigos na homologação. | Aprovado. |
| INC-024 | Roteiro Playwright e nove capturas reproduzíveis adicionados. | `npm run test:visual`. | Aprovado; 9/9 capturas. |
| INC-025 | Dois usuários com perfis distintos consultam a mesma base. | Verificador e captura do Codificador. | Aprovado; ambos viram 993 registros. |
| INC-026 | Aplicativo reiniciado após a importação e os testes. | Restart da Machine, 2/2 health checks e novo login. | Aprovado; 993 registros permaneceram. |
| INC-027 | Auditoria mostra dados anteriores, posteriores e detalhes. | Browser na administração após ações reais. | Aprovado. |
| INC-028 | Disponibilidade da categoria depende da configuração oficial completa e dos metadados do servidor. | Teste exaustivo de campos/fórmulas. | Aprovado. |
| INC-029 | Frontend não contém catálogo reduzido; consome categorias, referências e metadados da API. | Inspeção e teste de falha de API. | Aprovado. |
| INC-030 | Inventários completos de categorias e referências são gerados automaticamente. | `npm run audit:v311`. | Aprovado; 147 categorias, 574 referências e zero diferenças. |

## Conclusão da homologação

- Fonte V3.11 embutida: 140 categorias padrão, 603 referências padrão e 83 códigos padrão.
- Excel consolidado: 986 códigos, 145 categorias, 604 linhas de referência e 5 históricos.
- Resultado efetivo das regras oficiais: 147 categorias e 574 referências ativas.
- PostgreSQL de homologação: 12 naturezas, 147 categorias, 574 referências ativas e 986 códigos históricos inalterados.
- Após os cenários funcionais: 993 códigos totais, incluindo sete códigos de teste; ambos os usuários viram a mesma quantidade.
- Migrações `001`, `002` e `003` homologadas; a reconciliação da produção antiga originou a migração complementar `004`, que inativa sem excluir seis modelos já versionados no domínio e 21 aliases semânticos de diâmetro.
- Produção preservada. O próximo passo é backup e implantação somente após autorização explícita.
- Encerramento da homologação: aplicação temporária destruída e usuário PostgreSQL temporário revogado; o banco isolado permaneceu sem credencial ativa.
