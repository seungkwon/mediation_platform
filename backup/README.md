# 백업 / 복원

현재 PostgreSQL 데이터베이스(`mediation_platform`)와 업로드된 파일(`backend/uploads`)을
백업하고, 다른 컴퓨터에서 그대로 복원하기 위한 폴더입니다.

## 요구 사항

- Docker / Docker Compose (`docker/docker-compose.yml`로 Postgres 컨테이너가 떠 있어야 함)
- macOS/Linux: `zip`, `unzip` (기본 내장)
- Windows: PowerShell 5.1 이상 (기본 내장, 별도 설치 불필요)

## 백업하기

현재 컴퓨터에서 실행 중인 DB/업로드 파일을 `backup/db_backup.dump`, `backup/uploads_backup.zip`으로 저장합니다.

- macOS/Linux: `bash backup/backup.sh`
- Windows: `powershell -File backup\backup.ps1`

## 다른 컴퓨터로 옮기기

`backup` 폴더 전체(스크립트 + `db_backup.dump` + `uploads_backup.zip`)를 복사해서
새 컴퓨터의 같은 프로젝트 경로(`backup/`)에 넣습니다.

## 복원하기

새 컴퓨터에서 프로젝트를 클론하고 `docker/docker-compose.yml`이 준비된 상태에서 실행합니다.
**기존 DB 데이터와 `backend/uploads` 폴더는 삭제되고 백업 내용으로 덮어씌워집니다.**

- macOS/Linux: `bash backup/restore.sh`
- Windows: `powershell -File backup\restore.ps1`

복원 후에는 백엔드 서버를 재시작하세요. 백업 시점 이후 코드에 새 Alembic 마이그레이션이
추가되었다면 복원 후 `uv run alembic upgrade head`를 한 번 실행하세요.

## 컨테이너/DB 이름이 다른 경우

환경 변수로 재정의할 수 있습니다 (기본값은 `docker/docker-compose.yml`, `backend/.env` 기준).

| 변수 | 기본값 |
|---|---|
| `DB_CONTAINER` | `mediation_platform_postgres` |
| `DB_USER` | `mediation` |
| `DB_NAME` | `mediation_platform` |
| `UPLOADS_DIR` | `backend/uploads` (프로젝트 루트 기준) |

예) macOS: `DB_NAME=other_db bash backup/backup.sh`
예) Windows: `$env:DB_NAME="other_db"; powershell -File backup\backup.ps1`

## 주의

- `db_backup.dump`, `uploads_backup.zip`은 실제 회원 정보/업로드 파일을 포함하므로 git에는
  커밋되지 않도록 `.gitignore`에 등록되어 있습니다. 다른 컴퓨터로는 직접 파일 복사(USB, 사내망 등)로
  옮기세요.
