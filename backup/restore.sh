#!/usr/bin/env bash
# backup 폴더의 백업으로 데이터베이스와 업로드 파일을 복원합니다. (macOS/Linux용)
# 주의: 기존 DB 데이터와 uploads 폴더는 덮어씌워집니다.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DB_CONTAINER="${DB_CONTAINER:-mediation_platform_postgres}"
DB_USER="${DB_USER:-mediation}"
DB_NAME="${DB_NAME:-mediation_platform}"
UPLOADS_DIR="${UPLOADS_DIR:-$PROJECT_ROOT/backend/uploads}"

DB_DUMP="$SCRIPT_DIR/db_backup.dump"
UPLOADS_ARCHIVE="$SCRIPT_DIR/uploads_backup.zip"

if [ ! -f "$DB_DUMP" ]; then
  echo "DB 백업 파일이 없습니다: $DB_DUMP" >&2
  exit 1
fi
if [ ! -f "$UPLOADS_ARCHIVE" ]; then
  echo "업로드 백업 파일이 없습니다: $UPLOADS_ARCHIVE" >&2
  exit 1
fi

echo "==> Postgres 컨테이너 기동 중..."
(cd "$PROJECT_ROOT/docker" && docker compose up -d)

echo "==> Postgres 준비 대기 중..."
until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" > /dev/null 2>&1; do
  sleep 1
done

echo "==> DB 복원 중 (기존 데이터는 삭제 후 덮어씌워집니다)..."
docker cp "$DB_DUMP" "$DB_CONTAINER:/tmp/db_backup.dump"
docker exec "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists -1 /tmp/db_backup.dump
docker exec "$DB_CONTAINER" rm -f /tmp/db_backup.dump

echo "==> 업로드 파일 복원 중 (기존 uploads 폴더는 삭제 후 교체됩니다)..."
rm -rf "$UPLOADS_DIR"
mkdir -p "$UPLOADS_DIR"
unzip -qo "$UPLOADS_ARCHIVE" -d "$UPLOADS_DIR"

echo "==> 복원 완료. 백엔드 서버를 (재)시작하세요."
