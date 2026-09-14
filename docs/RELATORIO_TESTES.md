# Relatório de testes

Data: 14/09/2026.
Ambiente integrado: Fly.io isolado `sap-codigos-audit-v311-20260914`, banco PostgreSQL `sap_codigos_audit_20260914`.

Após a coleta das evidências, a aplicação temporária foi destruída e o usuário PostgreSQL exclusivo de auditoria foi revogado. A aplicação de produção permaneceu saudável, com 2/2 verificações aprovadas.

Na validação final de produção, `/health` retornou `ok`, `/ready` retornou `ready`, a Machine permaneceu com 2/2 verificações aprovadas e a consulta direta confirmou 986 de 986 códigos históricos, 147 categorias e 574 referências ativas, sem diferenças.

## Resultado consolidado

| Verificação | Resultado |
| --- | --- |
| Compilação TypeScript | Aprovada |
| Validação sintática do frontend e do roteiro visual | Aprovada |
| Vitest | 19 aprovados, 0 falhas; 2 testes genéricos ignorados sem `TEST_DATABASE_URL` local |
| Paridade automatizada V3.11 | 147 categorias e 574 referências, zero diferenças |
| Auditoria de dependências de produção | 0 vulnerabilidades conhecidas |
| Migrações em PostgreSQL real | `001`, `002`, `003` e `004` aplicadas; release concluído |
| Importação/seed isolado | 986 códigos históricos, 147 categorias, 574 referências e 5 históricos |
| Concorrência com dois usuários | 2 códigos únicos (`000003` e `000004`) |
| Confirmação simultânea do mesmo item | 1 gravado e 1 bloqueado |
| Lote válido | 2 códigos únicos gravados |
| Lote duplicado | Bloqueado com rollback integral |
| Exportação XLSX | 4 abas e 993 códigos lidos novamente |
| Reinício e persistência | Machine saudável 2/2; 993 códigos permaneceram |
| Segundo usuário | Administrador e Codificador viram os mesmos 993 registros |
| Teste visual Playwright | 9 cenários aprovados |
| Falha de catálogo | Mensagem visível e gerador bloqueado |

## Cobertura funcional

Foram exercitados login, carga automática dos catálogos, busca parcial sem acentos/caixa, seleção automática de natureza/categoria, Chapa, Tubo MP, Tubo PI, Flange, Instrumento, descrições, códigos, geração individual, lote, duplicidade, concorrência, importação administrativa, consulta direta ao PostgreSQL, reinício, segundo usuário, exportação, histórico e contingência de API.

O teste visual revelou e permitiu corrigir uma falha real do login: `event.currentTarget` era consultado depois de um `await`, interrompendo a carga dos catálogos. Os formulários de login, troca de senha e criação de usuário agora preservam a referência do formulário antes da operação assíncrona, e há regressão automatizada para impedir o retorno desse padrão.

Os dois testes em `test/integration/concurrency.test.ts` continuam condicionais porque criam e removem schema e exigem `TEST_DATABASE_URL` local. A mesma proteção foi efetivamente exercitada pelo verificador de homologação contra PostgreSQL real, incluindo geração simultânea, conflito e lote.

## Evidências visuais

As nove imagens estão em `docs/screenshots-v311/`, acompanhadas de `evidence.json`. A captura final do segundo usuário mostra 993 registros após o reinício; os 986 históricos permanecem inalterados e os sete adicionais pertencem aos testes de concorrência e lote.

## Comandos reproduzíveis

```powershell
npm ci
npm run build
npm test
npm run audit:v311
$env:AUDIT_APP_URL='https://aplicacao-de-homologacao.example'
$env:AUDIT_TEST_PASSWORD='senha-exclusiva-de-teste'
npm run test:visual
```

Para o teste genérico de integração, use apenas um PostgreSQL descartável:

```powershell
$env:TEST_DATABASE_URL='postgresql://usuario:senha@host:5432/banco_de_teste'
npm run test:integration
```
