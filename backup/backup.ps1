# 현재 데이터베이스와 업로드 파일을 backup 폴더에 백업합니다. (Windows용)
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

$running = docker ps --format "{{.Names}}"
if (-not ($running -contains $DbContainer)) {
    Write-Error "컨테이너 '$DbContainer'가 실행 중이 아닙니다. docker\ 폴더에서 'docker compose up -d'를 먼저 실행하세요."
    exit 1
}

if (-not (Test-Path $UploadsDir)) {
    Write-Error "업로드 폴더를 찾을 수 없습니다: $UploadsDir"
    exit 1
}

Write-Host "==> DB 덤프 중... ($DbName)"
docker exec $DbContainer pg_dump -U $DbUser -d $DbName -F c -f /tmp/db_backup.dump
if (Test-Path $DbDump) { Remove-Item $DbDump -Force }
docker cp "${DbContainer}:/tmp/db_backup.dump" $DbDump
docker exec $DbContainer rm -f /tmp/db_backup.dump

Write-Host "==> 업로드 파일 압축 중... ($UploadsDir)"
if (Test-Path $UploadsArchive) { Remove-Item $UploadsArchive -Force }
Compress-Archive -Path (Join-Path $UploadsDir "*") -DestinationPath $UploadsArchive -Force

Write-Host "==> 백업 완료:"
Write-Host "  - $DbDump"
Write-Host "  - $UploadsArchive"
Write-Host "이 backup 폴더 전체를 다른 컴퓨터로 옮긴 뒤 restore.ps1(윈도우) 또는 restore.sh(맥)을 실행하세요."
