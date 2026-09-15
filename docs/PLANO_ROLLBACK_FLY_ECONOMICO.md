# Plano de rollback — Fly econômico

## Atualização após exclusão autorizada — 15/09/2026

O responsável dispensou expressamente as 72 horas; o cluster e a web antigos foram excluídos após backups finais e restaurações novas comprovadas. **O retorno direto aos recursos antigos descrito nas seções históricas abaixo não está mais disponível. Não executar unfreeze nem tentar reconectar ao cluster excluído.** Recuperação agora exige provisionar um recurso independente, restaurar um dump externo protegido, comparar integralmente e somente depois configurar a conexão privada via Fly secrets. Preferir o backup mais recente da produção nova para evitar perda de gravações posteriores. Os dumps imediatamente anteriores à exclusão e seus checksums constam em [EXCLUSAO_FLY_ECONOMICO_20260915.md](EXCLUSAO_FLY_ECONOMICO_20260915.md). A imagem antiga registrada no provedor não tem retenção garantida; os commits permanecem no Git para reconstrução.

## Estado protegido

O cluster original `dzx6qo65n3g0jpv5` (sap-codigos-db) permanece intacto. O login sap_app foi limitado a Reader pelo comando administrativo oficial `flyctl mpg users set-role`; escrita e escalada para schema_admin foram rejeitadas. Sessões SQL antigas do mesmo login/banco foram encerradas na manutenção. A web antiga mantém sua DATABASE_URL original e bloqueia a API antes da autenticação, evitando atualizações assíncronas de sessões.

Preservar até, no mínimo, **18/09/2026 12:00, Brasília (15:00 UTC)**, e além desse horário até autorização expressa de exclusão. O limite foi arredondado conservadoramente após o alinhamento final de biblioteca/índices. Não foi concedida dispensa de 72 horas.

## Teste de retorno realizado

Com as duas webs em manutenção e sem escrita liberada, a DATABASE_URL da web nova foi temporariamente redirecionada ao MPG antigo via stdin/Fly secrets. A consulta pelo runtime confirmou o host pgbouncer do cluster original, banco fly-db, 986 códigos e 3 usuários. Depois a secret foi restabelecida para `sap-codigos-postgres-economico.internal/fly-db`; o runtime confirmou a nova Machine privada, e somente então a manutenção nova foi desativada.

Esse teste comprovou **reversibilidade da configuração/conectividade**, sem apagar, sobrescrever ou modificar dados antigos. Não foi feita recuperação destrutiva do banco. A imagem funcional anterior também foi preservada pelo registro: `registry.fly.io/sap-codigos-multiusuario:deployment-01M2GWC6QGJNRCCFAZ71B7T5TP` (release 12 anterior); os commits anteriores continuam no Git.

## Incidente sem novas gravações após o corte

1. Ativar manutenção na web nova pelo helper importSecrets, usando apenas stdin, sem imprimir credenciais.
2. Fazer backup de ambos os bancos em novas pastas protegidas e verificar integridade/100% de correspondência de negócio. Não assumir que o antigo está atualizado.
3. Se não houver nenhuma diferença de negócio, restaurar a role sap_app antiga para schema_admin com `node scripts/migration-source-control.mjs unfreeze`.
4. Confirmar no runtime a conexão da web antiga ao banco antigo, validar health/readiness e, só depois, remover manutenção/redirecionamento antigos pelo helper seguro. Manter a web nova em manutenção para impedir split-brain.
5. Testar acesso/permissões/persistência e registrar o incidente. Nunca apontar duas webs graváveis para bancos diferentes.

## Incidente com novas gravações no PostgreSQL econômico

Não basta trocar DATABASE_URL para o backup antigo: isso perderia gravações posteriores ao corte. Primeiro congelar a aplicação nova, gerar backup completo consistente do novo fly-db e preservar seus checksums. Restaurar esse backup em um banco/ambiente de recuperação vazio e validar todas as estruturas/linhas/sequências antes de redirecionar a aplicação. Se for necessário retornar ao MPG, criar um banco lógico de recuperação novo no cluster antigo, com autorização operacional adequada, e reconciliar os dados; não limpar ou sobrescrever o fly-db antigo automaticamente.

Uma divergência não explicada interrompe o retorno. Nenhum DROP DATABASE, destruição de volume ou remoção de cluster está autorizado por este plano. Depois da exclusão do MPG, recuperar exige novo servidor/volume com as extensões compatíveis e os backups externos; a cópia original do provedor não estará mais disponível.

## Utilitários sem credenciais em argumentos

`migration-source-control.mjs` altera somente a role sap_app do cluster exato; `migration-target.mjs` contém importSecrets e URLs montadas em memória; `migration-verify.mjs` confirma host/banco/contagens sem emitir a string de conexão. Não usar impressão de secrets, passwords literais, scripts do aplicativo de soldagem ou nomes de recursos abreviados.
