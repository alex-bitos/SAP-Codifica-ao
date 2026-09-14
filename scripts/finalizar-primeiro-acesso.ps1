[CmdletBinding()]
param(
  [string]$App = 'sap-codigos-multiusuario',
  [string]$Workbook = (Join-Path $PSScriptRoot '..\Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx')
)

$ErrorActionPreference = 'Stop'
$temporaryRemoteFile = '/tmp/sap-codigos-importacao-inicial.xlsx'
$secretNames = @(
  'INITIAL_ADMIN_LOGIN',
  'INITIAL_ADMIN_NAME',
  'INITIAL_ADMIN_PASSWORD',
  'IMPORT_USER_LOGIN',
  'CONFIRM_IMPORT'
)
$secretWasConfigured = $false
$passwordPointer = [IntPtr]::Zero
$confirmationPointer = [IntPtr]::Zero
$password = $null
$confirmation = $null

function Assert-FlySucceeded([string]$Action) {
  if ($LASTEXITCODE -ne 0) {
    throw "$Action falhou (codigo $LASTEXITCODE)."
  }
}

try {
  if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    throw 'flyctl nao foi encontrado no PATH.'
  }
  if (-not (Test-Path -LiteralPath $Workbook -PathType Leaf)) {
    throw "Planilha nao encontrada: $Workbook"
  }

  Write-Host 'Verificando a conta Fly.io...'
  & flyctl auth whoami
  Assert-FlySucceeded 'A verificacao da conta Fly.io'

  $login = (Read-Host 'Login do primeiro administrador [alexandre]').Trim().ToLowerInvariant()
  if (-not $login) { $login = 'alexandre' }
  if ($login -notmatch '^[a-z0-9._-]{3,80}$') {
    throw 'O login deve ter de 3 a 80 caracteres: letras minusculas, numeros, ponto, sublinhado ou hifen.'
  }

  $name = (Read-Host 'Nome do primeiro administrador [Alexandre]').Trim()
  if (-not $name) { $name = 'Alexandre' }

  $securePassword = Read-Host 'Senha temporaria (12+ caracteres, maiuscula, minuscula, numero e simbolo)' -AsSecureString
  $secureConfirmation = Read-Host 'Repita a senha temporaria' -AsSecureString
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $confirmationPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirmation)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $confirmation = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmationPointer)

  if ($password -ne $confirmation) { throw 'As senhas digitadas nao coincidem.' }
  if ($password.Length -lt 12 -or $password.Length -gt 128 -or
      $password -notmatch '[a-z]' -or $password -notmatch '[A-Z]' -or
      $password -notmatch '\d' -or $password -notmatch '[^A-Za-z0-9]' -or
      $password -match '[\r\n]') {
    throw 'A senha deve ter de 12 a 128 caracteres, com maiuscula, minuscula, numero e simbolo, sem quebra de linha.'
  }

  Write-Host 'Configurando segredos temporarios sem grava-los no historico...'
  @(
    "INITIAL_ADMIN_LOGIN=$login"
    "INITIAL_ADMIN_NAME=$name"
    "INITIAL_ADMIN_PASSWORD=$password"
    "IMPORT_USER_LOGIN=$login"
    'CONFIRM_IMPORT=YES'
  ) | & flyctl secrets import --app $App
  Assert-FlySucceeded 'A configuracao dos segredos temporarios'
  $secretWasConfigured = $true

  Write-Host 'Criando o primeiro administrador...'
  & flyctl ssh console --app $App --command 'node dist/cli/create-admin.js'
  Assert-FlySucceeded 'A criacao do administrador'

  Write-Host 'Enviando e importando a planilha inicial...'
  & flyctl ssh sftp put $Workbook $temporaryRemoteFile --app $App --mode 0600
  Assert-FlySucceeded 'O envio da planilha'
  & flyctl ssh console --app $App --command "node dist/cli/import-initial.js $temporaryRemoteFile"
  Assert-FlySucceeded 'A importacao inicial'

  Write-Host 'Primeiro acesso e importacao concluidos.'
} finally {
  $password = $null
  $confirmation = $null
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  if ($confirmationPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmationPointer)
  }

  if ($secretWasConfigured) {
    & flyctl ssh console --app $App --command "rm -f $temporaryRemoteFile" 2>$null
    Write-Host 'Removendo todos os segredos temporarios...'
    & flyctl secrets unset @secretNames --app $App
    Assert-FlySucceeded 'A remocao dos segredos temporarios'
  }
}
