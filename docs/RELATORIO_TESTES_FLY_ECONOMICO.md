# Regressão funcional — Fly econômico

15/09/2026. Build TypeScript aprovado; 30 testes unitários/paridade aprovados. Os 10 testes PostgreSQL, que ficam ignorados no comando unitário sem TEST_DATABASE_URL, foram executados separadamente no servidor novo e passaram.

Após alinhar a base do PostgreSQL para trixie/libc 2.41 e reconstruir os índices, as duas suítes PostgreSQL foram repetidas às 14:40:33 UTC: 10/10 aprovados, duração 48,30 segundos. Os testes rápidos de produção também foram repetidos às 14:42:06 UTC, novamente preservando o SHA lógico completo. O relatório de collation-comparison.json protegido confirma locale/charset/provider/versão iguais ao antigo.

## Isolamento

As gravações de homologação ocorreram em `sap_migration_test`, na mesma Machine PostgreSQL/volume da futura produção, mas em banco lógico separado. Nenhuma senha ou hash dos usuários originais foi substituído. As contas `audit_admin`, `audit_coder`, `audit_reader`, com nomes Migration, receberam credenciais aleatórias só em memória. As três contas originais de produção permaneceram intactas.

O clone terminou com 1074 códigos devido aos ensaios e retomadas. Esses códigos **não estão na produção**, cujo backup final continha 986 registros. A produção foi restaurada em banco lógico novo, sem aproveitar o clone modificado.

## Resultados

| Cenário | Resultado/evidência |
| --- | --- |
| Login/logout | Login real com senha aleatória e Argon2 no clone; logout invalidou sessão |
| Administrador, Codificador, Consulta | Restrições de usuários/importação/escrita e consulta compartilhada aprovadas |
| Multiusuário | Sessões simultâneas e mesma contagem de códigos para os três perfis |
| Catálogos/busca | 12 naturezas, 147 categorias; busca Tubo retornou MP e PI |
| Campos dinâmicos | Paridade das 147 configurações; navegador validou Tubo MP, Chapa, Flange, Instrumento e os 11 PA |
| Consulta | Histórico carregado diretamente do banco, sem nova importação de planilha |
| Todos os Produtos Acabados | 11 gerações individuais e lote de 11 pelo navegador, além da suíte PostgreSQL |
| MaxiMesh | Campos, composição, gravação e rejeição de duplicidade aprovados |
| Flange Cover | Combinação fixa oficial, geração individual/lote; sem DV e sem aplicar sequencial indevido |
| Tubo MP/PI, Flange, Pestana e duas Uniões | Campos, preview, geração canônica, 6 dígitos, DV vazio e segunda confirmação rejeitada |
| Concorrência | 20 confirmações simultâneas na API por dois usuários, sem colisões; suíte PostgreSQL também validou 20 requisições e confirmação duplicada simultânea |
| Importação Excel administrativa | Carga única em schema isolado, simulação com zero novas inclusões, segunda confirmação bloqueada com 409 |
| Rollback de importação | Falha controlada após início da transação não deixou linhas parciais |
| Excel de lote/exportação | Lote transacional de 11 PA; XLSX exportado continha todos os códigos visíveis |
| Histórico/auditoria | Linhas antigas preservadas por SHA; novas gerações de teste apareceram na auditoria do clone |
| Reinício web/PG | Machines reiniciadas; todas as tabelas de negócio mantiveram seus hashes |
| Persistência/sessões | Contagem de sessões mantida após reinício; outro usuário continuou autenticado |
| Falha de catálogo | Navegador bloqueou o gerador e mostrou o erro esperado |

Para o teste de persistência do clone, somente o hash da tabela sessions foi tratado como operacionalmente volátil, porque requisições anteriores podem atualizar last_seen_at de forma assíncrona; sua quantidade foi exigida igual. Nenhum campo de sessions foi excluído da comparação final da migração.

A União Solda de Encaixe conserva a característica Diâmetro Fixação existente na V3.11. O ensaio utilizou `3/4"`, presente nesse catálogo. Flange/Pestana/Tubo utilizaram valores de diâmetro codificáveis; não foram alteradas regras para acomodar escolhas de teste inválidas.

## Testes rápidos de produção

Às 14:26:27 UTC e novamente às 14:30:07 UTC, após o ajuste/reinício final do PG:

- HTTPS, frontend, /health e /ready aprovados.
- Runtime confirmou `sap-codigos-postgres-economico.internal`, banco `fly-db`, servidor privado da nova Machine.
- Endereço antigo respondeu 307 para páginas; API antiga respondeu 503 antes da autenticação/escrita.
- Consulta, indicador de banco e permissões do Administrador migrado aprovados usando sessão temporária controlada. Essa sessão foi removida; hashes e linhas originais continuaram iguais.
- A credencial da nova aplicação aceitou transação e UPDATE WHERE false, seguido de rollback, sem mudar dados.
- Os hashes de todas as tabelas/estruturas continuaram iguais ao snapshot final.

Os logins com senha foram testados no clone, não com senhas dos usuários originais de produção. Nenhuma senha foi solicitada. Em produção, a exigência de troca de senha existente foi mantida.

## Evidências protegidas

Diretório: `C:\Users\alexandre\AppData\Local\SAP-Codigos-Backups\migration-20260915-regression`.

Contém `integration-results.txt`, `regression-results.json`, screenshots e evidence.json em `visual-v311` e `visual-finished`. O resumo sem credenciais está no [JSON da comparação](comparacao-bancos-20260915.json).

Scripts: `migration-regression.mjs`, `migration-production-smoke.mjs`, `visual-audit.mjs` e `finished-products-visual-audit.mjs`. A busca rápida, as regras V3.11 e a lógica de composição mantêm os testes previamente consolidados; a única mudança no servidor foi a barreira operacional de manutenção/redirecionamento, inativa por padrão.
