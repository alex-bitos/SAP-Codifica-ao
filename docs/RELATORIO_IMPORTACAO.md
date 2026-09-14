# Relatório da importação administrativa

Data: 14/09/2026  
Arquivo: `Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx`  
Hash SHA-256: `d60fd06eed8e3c463038830758783ab679a086f3f2e8ec95f36be6a8ea215cb7`

## Simulação antes da confirmação

| Área | Linhas no arquivo | Resultado oficial | Situação no banco vazio |
| --- | ---: | ---: | --- |
| Códigos | 986 | 986 | 986 inclusões |
| Categorias | 145 | 147 após regras | 147 inclusões |
| Referências | 604 | 574 após mesclagem | 574 inclusões |
| Histórico | 5 | 5 | 5 inclusões |

Validações: quatro abas encontradas (`Codigos`, `Categorias`, `Referencias`, `Historico`), zero conflitos canônicos de código, zero conflitos técnicos críticos e 24 referências mescláveis na simulação contra a base já populada. Foram emitidos os avisos de preservação de 198 dígitos verificadores históricos na forma legada e de 705 códigos legados fora do formato novo.

## Confirmação e persistência

A carga foi executada em banco PostgreSQL isolado, dentro de transação única. A consulta direta posterior confirmou 986 códigos históricos, 147 categorias, 574 referências ativas e 5 históricos. A repetição do mesmo arquivo é bloqueada por hash, garantindo idempotência.

Depois da importação foram realizados testes funcionais que criaram sete códigos adicionais. O total passou a 993, sem alteração dos 986 históricos. O aplicativo foi reiniciado e dois usuários distintos continuaram visualizando os mesmos 993 registros.

## Auditoria e segurança

- confirmação restrita ao perfil Administrador;
- arquivo e hash registrados em `database_imports`;
- ação registrada em `audit_log`;
- códigos legados preservados sem renumeração;
- referências obsoletas inativadas, não apagadas;
- qualquer erro provoca rollback integral;
- nenhuma escrita foi feita no banco de produção durante esta auditoria.

## Evidência visual

A captura `docs/screenshots-v311/08-importacao-administrativa.png` mostra a simulação administrativa com abas, contagens, existentes, inclusões, bloqueios, duplicidades e inconsistências antes da confirmação.
