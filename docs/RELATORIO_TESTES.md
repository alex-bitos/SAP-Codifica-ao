# Relatório de testes

Data: 14/09/2026.

## Executado nesta estação

- Compilação TypeScript de produção: aprovada.
- Testes automatizados: 8 aprovados, 0 falhas.
- Testes de regras: Tubo MP/PITU, descrição, chave técnica separada por natureza, sequencial de seis dígitos, Flange Cover e validações de Flange.
- Segurança: política de senha e hash/verificação Argon2id.
- Excel consolidado real: quatro abas obrigatórias, 986 códigos, 145 categorias, 604 referências, 5 históricos, SHA-256 e ausência de conflito canônico.
- Auditoria de dependências: 0 vulnerabilidades conhecidas após atualização do runner.
- HTTP local: `/` respondeu 200 com o frontend completo.

## Automatizado, exige PostgreSQL real

`test/integration/concurrency.test.ts` cria um schema isolado, aplica as migrações e verifica:

- vinte gerações simultâneas resultam em vinte códigos únicos, com sufixos de `000001` a `000020`;
- duas confirmações simultâneas do mesmo item gravam apenas uma;
- a restrição única e a transação protegem o código e a chave técnica.

Os dois testes foram ignorados nesta estação porque `TEST_DATABASE_URL` não estava definida e não há PostgreSQL/Docker instalado. Execute `TEST_DATABASE_URL=<conexao-de-teste> npm run test:integration` em banco descartável antes da produção.

## Validação de aceite pendente em ambiente integrado

Login válido/inválido, bloqueio após tentativas, logout/revogação, troca obrigatória, todos os perfis, importação confirmada, reinício, duas instâncias, exportação/reimportação, health/readiness e migração de release devem ser exercitados contra PostgreSQL real. Não foram declarados como aprovados sem o ambiente necessário.
