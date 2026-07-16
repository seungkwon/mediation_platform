# backup 폴더의 백업으로 데이터베이스와 업로드 파일을 복원합니다. (Windows용)
# 주의: 기존 DB 데이터와 uploads 폴더는 덮어씌워집니다.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

function Get-EnvOrDefault($name, $default) {
    $value = [Environment]::GetEnvironmentVariable($name)
    if ([string]::IsNullOrEmpty($value)) { return $default }
    return $value
}

$DbContainer = Get-EnvOrDefault "DB_CONTAINER" "mediation_platform_postgres"
$DbUser = Get-EnvOrDefault "DB_USER" "mediation"
$DbName = Get-EnvOrDefault "DB_NAME" "mediation_platform"
$UploadsDir = Get-EnvOrDefault "UPLOADS_DIR" (Join-Path $ProjectRoot "backend\uploads")

$DbDump = Join-Path $ScriptDir "db_backup.dump"
$UploadsArchive = Join-Path $ScriptDir "uploads_backup.zip"

if (-not (Test-Path $DbDump)) {
    Write-Error "DB 백업 파일이 없습니다: $DbDump"
    exit 1
}
if (-not (Test-Path $UploadsArchive)) {
    Write-Error "업로드 백업 파일이 없습니다: $UploadsArchive"
    exit 1
}

Write-Host "==> Postgres 컨테이너 기동 중..."
Push-Location (Join-Path $ProjectRoot "docker")
try {
    docker compose up -d
} finally {
    Pop-Location
}

Write-Host "==> Postgres 준비 대기 중..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    docker exec $DbContainer pg_isready -U $DbUser *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Error "Postgres가 준비되지 않았습니다."
    exit 1
}

Write-Host "==> DB 복원 중 (기존 데이터는 삭제 후 덮어씌워집니다)..."
docker cp $DbDump "${DbContainer}:/tmp/db_backup.dump"
docker exec $DbContainer pg_restore -U $DbUser -d $DbName --clean --if-exists -1 /tmp/db_backup.dump
docker exec $DbContainer rm -f /tmp/db_backup.dump

Write-Host "==> 업로드 파일 복원 중 (기존 uploads 폴더는 삭제 후 교체됩니다)..."
if (Test-Path $UploadsDir) { Remove-Item $UploadsDir -Recurse -Force }
New-Item -ItemType Directory -Path $UploadsDir -Force | Out-Null
Expand-Archive -Path $UploadsArchive -DestinationPath $UploadsDir -Force

Write-Host "==> 복원 완료. 백엔드 서버를 (재)시작하세요."
