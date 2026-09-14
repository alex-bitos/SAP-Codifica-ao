# Funcionalidades preservadas da V3.11

- Naturezas e categorias carregadas do banco consolidado, com regras oficiais aplicadas na importação.
- Tubo como Matéria Prima (`MPTU`) e Produto Intermediário (`PITU`) com os mesmos campos técnicos.
- Prefixo composto por código-base e até duas referências, seguido de exatamente seis algarismos.
- Dígito verificador vazio para registros operacionais novos.
- Código canônico único e chave técnica única por natureza; o mesmo Tubo pode existir como MP e PI.
- Validações especiais de Tubo, Flange, Pestana, União Roscada e União Solda de Encaixe.
- Flange Cover por combinação fixa `PAFC + modelo + material + diâmetro + classe + dreno`, sem sequencial e sem DV.
- Geração individual com prévia estimada e confirmação transacional.
- Geração em lote validada e confirmada integralmente em uma transação.
- Consulta, filtros e paginação processados no servidor.
- Categorias e referências adicionais por endpoints administrativos.
- Histórico/auditoria para acessos e operações críticas.
- Exportação das abas `Codigos`, `Categorias`, `Referencias` e `Historico` para Excel.
- Preservação literal dos códigos históricos, inclusive formatos legados.

O arquivo HTML V3.11 não é executado como autoridade de dados na nova aplicação. Ele permanece como referência de regras e identidade visual; decisões de sequência, duplicidade e confirmação ficam exclusivamente no servidor/PostgreSQL.
