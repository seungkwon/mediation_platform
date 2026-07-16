#!/usr/bin/env bash
# 현재 데이터베이스와 업로드 파일을 backup 폴더에 백업합니다. (macOS/Linux용)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DB_CONTAINER="${DB_CONTAINER:-mediation_platform_postgres}"
DB_USER="${DB_USER:-mediation}"
DB_NAME="${DB_NAME:-mediation_platform}"
UPLOADS_DIR="${UPLOADS_DIR:-$PROJECT_ROOT/backend/uploads}"

DB_DUMP="$SCRIPT_DIR/db_backup.dump"
UPLOADS_ARCHIVE="$SCRIPT_DIR/uploads_backup.zip"

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "컨테이너 '$DB_CONTAINER'가 실행 중이 아닙니다. docker/ 폴더에서 'docker compose up -d'를 먼저 실행하세요." >&2
  exit 1
fi

if [ ! -d "$UPLOADS_DIR" ]; then
  echo "업로드 폴더를 찾을 수 없습니다: $UPLOADS_DIR" >&2
  exit 1
fi

echo "==> DB 덤프 중... ($DB_NAME)"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f /tmp/db_backup.dump
docker cp "$DB_CONTAINER:/tmp/db_backup.dump" "$DB_DUMP"
docker exec "$DB_CONTAINER" rm -f /tmp/db_backup.dump

echo "==> 업로드 파일 압축 중... ($UPLOADS_DIR)"
rm -f "$UPLOADS_ARCHIVE"
(cd "$UPLOADS_DIR" && zip -qr "$UPLOADS_ARCHIVE" .)

echo "==> 백업 완료:"
echo "  - $DB_DUMP"
echo "  - $UPLOADS_ARCHIVE"
echo "이 backup 폴더 전체를 다른 컴퓨터로 옮긴 뒤 restore.sh(맥) 또는 restore.ps1(윈도우)을 실행하세요."
