# 중계 플랫폼

서비스 판매자와 구매자를 연결하는 역경매(견적 요청) 기반 중계 플랫폼입니다.

- 판매자는 프로필과 블로그형 포트폴리오(사진/동영상/텍스트)를 등록해 자신의 서비스를 소개합니다.
- 구매자는 서비스 요청(텍스트/이미지/첨부파일, 예산, 입찰 마감시간)을 등록하면, 여러 판매자가 견적을 제출합니다.
- 견적은 기본적으로 비공개(sealed)이며, 구매자가 마감 전까지 후보를 열람(오픈)하고 최종 선택할 수 있습니다.
- 최종 선택 시 구매자-판매자 간 실시간 채팅(WebSocket)이 활성화되어 세부 협의를 진행합니다.
- 거래 완료 후 구매자는 리뷰/평점을 남길 수 있고, 관리자는 신고/분쟁을 처리합니다.
- 하나의 계정으로 판매자·구매자 역할을 동시에 수행할 수 있습니다.

더 자세한 요구사항과 설계는 [Plan.md](./Plan.md), [DetailedPlan.md](./DetailedPlan.md)를, 마일스톤별 진행 이력은 [Progress.md](./Progress.md)를 참고하세요.

## 기술 스택

| 영역 | 스택 |
|---|---|
| 프론트엔드 | React 19 (Vite) + TypeScript, Tailwind CSS v4, Pretendard 폰트, Orange 테마 |
| &nbsp; | React Router, TanStack Query, axios, zustand, React Hook Form + Zod |
| 백엔드 | Python + FastAPI, SQLAlchemy 2.0(async) + Alembic, Pydantic v2 |
| &nbsp; | JWT 인증(access/refresh), WebSocket 채팅 |
| DB | PostgreSQL 16 (Docker) |

## 폴더 구조

```
backend/    FastAPI 앱 (app/api, app/models, app/schemas, app/services, app/ws, alembic/, uploads/)
frontend/   React + Vite 앱 (src/routes, components, api, hooks, store, types)
docker/     PostgreSQL Docker Compose 설정
```

## 사전 준비물

- [Docker Desktop](https://www.docker.com/) (PostgreSQL 구동용)
- [uv](https://docs.astral.sh/uv/) (백엔드 Python 패키지 매니저)
- Node.js 20+ / npm (프론트엔드)

## 구동 방법

### 1. PostgreSQL (Docker)

```bash
cd docker
docker compose up -d
```

- 별도 `.env` 없이도 기본값(`mediation` / `mediation` / `mediation_platform`)으로 바로 기동됩니다. 값을 바꾸려면 `docker/.env.example`을 복사해 `docker/.env`로 사용하세요.

### 2. 백엔드 (FastAPI)

```bash
cd backend
cp .env.example .env   # DATABASE_URL 등은 기본값 그대로 사용 가능
uv run alembic upgrade head       # 최초 1회 또는 마이그레이션 추가 시
uv run uvicorn app.main:app --reload --port 8001
```

- API: http://localhost:8001/api/v1 , Swagger 문서: http://localhost:8001/docs
- **주의**: 개발 환경에 따라 기본 포트 8000이 다른 프로세스에 점유되어 있을 수 있어 8001을 사용합니다. 점유 여부를 확인 후 원하는 포트로 조정하세요.

### 3. 프론트엔드 (Vite)

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL이 백엔드 실행 포트와 일치해야 함
npm run dev
```

- 기본적으로 http://localhost:5173 에서 열리지만, 5173 포트가 이미 사용 중이면 Vite가 자동으로 다음 포트(5174 등)로 전환합니다. 콘솔에 출력되는 실제 URL을 확인하세요.
- Windows 환경에서 `localhost` 접속이 안 되면 `http://127.0.0.1:<포트>` 또는 `http://[::1]:<포트>`로 접속해보세요.

## 정지 방법

```bash
# 백엔드/프론트엔드: 각 터미널에서 Ctrl+C

# PostgreSQL 컨테이너 중지 (데이터는 볼륨에 유지됨)
cd docker
docker compose stop

# 데이터까지 완전히 삭제하려면 (주의: 복구 불가)
docker compose down -v
```

## 테스트 계정

개발/테스트 중 생성된 계정입니다. 비밀번호는 모두 `password123` 입니다.

| 이메일 | 이름 | 비고 |
|---|---|---|
| `buyer1@test.com` | Buyer One | 구매자 역할 테스트용, **관리자 권한 있음** (`/admin/reports`, `/admin/disputes` 접근 가능) |
| `seller1@test.com` | Seller One | 판매자 프로필 등록됨, 리뷰 2건 보유 (평점 집계 확인용) |
| `newseller@test.com` | New Seller | 판매자 프로필 있음 (최소 정보만 입력된 상태) |
| `frontend_test@test.com` | Frontend Tester | 판매자 프로필 없는 일반 계정 |
| `outsider@test.com` | Outsider | 판매자 프로필 없는 일반 계정 |

새로운 계정으로 회원가입부터 시작해 판매자 등록 → 서비스 요청 → 견적 제출/선택 → 채팅 → 리뷰까지 전체 플로우를 처음부터 테스트해볼 수도 있습니다.

관리자 권한이 필요한 계정을 새로 만들려면 `admin_users` 테이블에 직접 레코드를 추가해야 합니다 (별도 관리자 임명 API는 없음):

```sql
INSERT INTO admin_users (id, user_id, role) VALUES (gen_random_uuid(), '<user_id>', 'super_admin');
```

## 알려진 제약사항

- 소셜 로그인(네이버/카카오/구글/애플)은 API 골격만 있고, Provider 앱 등록(client_id/secret) 전까지는 501을 반환합니다.
- 신고 생성 UI(사용자/게시물/요청 등에 대한 "신고하기" 버튼)는 프론트엔드에 아직 없습니다. 관리자 대시보드에서 조회·처리만 가능하며, 신고 생성은 API(`POST /api/v1/reports`, `POST /api/v1/disputes`)로만 가능합니다.
