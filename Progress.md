# 진행 상황 (Progress)

> 마일스톤이 끝날 때마다 이 문서를 갱신합니다. 새 세션에서 작업을 이어갈 때는 이 문서와 [DetailedPlan.md](./DetailedPlan.md)를 먼저 참고하세요.

## 실행 환경 메모
- 패키지 매니저: 백엔드 `uv` (backend/pyproject.toml, uv.lock)
- DB: `docker/docker-compose.yml`로 Postgres 기동 (`cd docker && docker compose up -d`)
- 백엔드 로컬 실행: `cd backend && uv run uvicorn app.main:app --reload --port 8001`
  - **주의**: 이 개발 머신에서 포트 8000은 이 프로젝트와 무관한 다른 서비스가 이미 점유 중이라 테스트는 8001로 진행함. 실제 배포/사용 시에는 포트 정책을 다시 확인할 것.
- 백엔드 `.env`는 `backend/.env.example` 복사해서 사용 (`DATABASE_URL`이 `docker/.env`의 값과 일치해야 함)
- 패키지 매니저: 프론트엔드 `npm` (frontend/package.json, package-lock.json)
- 프론트엔드 로컬 실행: `cd frontend && npm install && npm run dev` (기본 5173 포트도 이 머신에서 다른 서비스가 점유 중이면 Vite가 자동으로 5174 등으로 폴백 — 콘솔 로그에서 실제 포트 확인)
- 프론트엔드 `.env`는 `frontend/.env.example` 복사해서 사용 (`VITE_API_BASE_URL`이 백엔드 실행 포트와 일치해야 함)
- Git 원격: https://github.com/seungkwon/mediation_platform.git (main 브랜치, 마일스톤마다 커밋/푸시)
- 마이그레이션: `cd backend && uv run alembic revision --autogenerate -m "..."` 후 `uv run alembic upgrade head`

## 완료된 마일스톤

### 0. 설계 문서
- [Plan.md](./Plan.md), [DetailedPlan.md](./DetailedPlan.md) 작성 완료 (스코프: 결제 제외, 실시간 채팅 포함, 로컬 파일 저장, 리뷰+관리자 포함)

### 1. 기반 구축
- 폴더 구조(`backend/`, `frontend/`, `docker/`) 생성
- `docker/docker-compose.yml` (Postgres 16, 볼륨 영속화)
- Git 저장소 초기화 및 원격 연결, `.gitignore` 구성

### 2. 백엔드 스캐폴딩 + DB
- FastAPI 앱(`backend/app/main.py`), 설정(`core/config.py`, pydantic-settings, `.env` 기반 — `upload_dir` 포함 전부 `.env`에서 로드)
- SQLAlchemy 2.0 async 모델 전체 작성 (`app/models/*.py`): User/SocialAccount, Category, SellerProfile/PortfolioPost/PortfolioMedia, ServiceRequest(+Image/Attachment), Quote(+Attachment), ChatRoom/ChatMessage, Review, AdminUser/Report/Dispute, Notification — 총 18개 테이블
  - `ServiceRequest.selected_quote_id` ↔ `Quote.service_request_id` 순환 FK는 `use_alter=True`로 해결
- Alembic(async) 설정, 초기 마이그레이션 생성 및 Postgres에 적용 완료 (검증됨)

### 3. 인증 API
- JWT access/refresh 발급(`core/security.py`), bcrypt 비밀번호 해시
- `/api/v1/auth`: signup, login, refresh, `/me`, `/{provider}/callback` (소셜 4종 골격 — 실제 client_id/secret은 `.env`에 비어있어 앱 등록 전까지 501 반환)
- curl로 회원가입/로그인/me/오답 케이스 검증 완료

### 4. 업로드 / 판매자 프로필 / 포트폴리오 API
- `/api/v1/uploads/{category}`: 로컬 디스크 저장, 확장자·용량 검증
- `/api/v1/sellers`: 프로필 생성/조회/수정 (+리뷰 평점 집계)
- `/api/v1/portfolios`: 블로그형 게시물 CRUD + 미디어, draft/published 가시성 제어
- curl 검증 완료 (업로드→정적 서빙까지 확인)

### 5. 역경매 핵심 (서비스 요청 / 견적)
- `/api/v1/service-requests`: 생성/목록/내 목록/상세/수정/취소, 마감시간 지난 `open` 요청은 조회 시 lazy하게 `expired`로 일괄 전이 (`services/matching.py`)
- `/api/v1/service-requests/{id}/quotes`, `/api/v1/quotes/mine`, `/api/v1/quotes/{id}/open`, `/api/v1/quotes/{id}/select`
  - **Sealed-bid 방식**: 구매자가 오픈하기 전 견적은 가격/기간/설명/첨부파일이 `null`로 마스킹되어 내려감 (`QuoteOut` 관련 필드 Optional화 + `_mask_if_sealed`)
  - 견적 제출 시 (buyer, seller) 쌍으로 `ChatRoom` 자동 생성
  - 낙찰 시 트랜잭션으로 선택된 견적 `selected`, 나머지 `rejected`, 요청 `awarded` 전이
- curl로 제출→목록(마스킹 확인)→오픈→선택→낙찰 전체 플로우 검증 완료
- 이 과정에서 `ServiceRequest.buyer`, `Quote.seller` relationship 누락 버그 발견 및 수정

### 6. 채팅 WebSocket API
- `app/ws/manager.py` (in-memory ConnectionManager), `app/api/v1/chat.py` (REST: 방 목록/메시지 이력, WS: `/api/v1/ws/chat/{room_id}?token=<JWT>`) 작성 완료, router 등록 완료
- 방 생성 시점: 판매자가 견적 제출 시 (buyer, seller) 쌍으로 자동 생성 (마일스톤 5에서 이미 구현됨)
- `manager.broadcast()`는 발신자 본인 연결에도 메시지를 보냄(멀티탭 동기화 목적) — 클라이언트는 서버가 확정한 메시지(id/timestamp)를 자신의 echo로 받아 처리해야 함
- 수신자가 미접속 상태면 `Notification(type=new_message)` 레코드 생성 (알림 조회 REST API는 마일스톤 8에서 구현 예정, 이번엔 DB 직접 조회로 생성 확인)
- 실제 서버(포트 8001) 기동 후 curl + `tests/manual_ws_test.py`(websockets 클라이언트)로 검증 완료: 회원가입→판매자프로필→서비스요청→견적제출(방 자동생성)→WS 연결(양방향 송수신, self-echo 포함)→메시지 이력 조회→오프라인 상대방 알림 생성까지 전체 플로우 확인

### 7. 리뷰 API
- `POST /api/v1/reviews`: 요청 작성자(buyer)만, `awarded` 상태(+`selected_quote_id` 존재)인 요청에 한해 작성 가능. `reviewee_id`는 선택된 견적의 `seller_id`로 서버가 자동 결정
  - `unique(service_request_id, reviewer_id)` 위반 시 409, 소유자 아님/미낙찰 요청이면 각각 403/400
  - 리뷰 생성 시 판매자에게 `Notification(type=new_review)` 발송
- `GET /api/v1/users/{user_id}/reviews`: 특정 사용자가 받은 리뷰 목록 (reviewee 기준, 최신순)
- `Review` 모델에 `reviewer` relationship 추가 (`ReviewOut` 스키마의 `reviewer: UserPublic` 직렬화용)
- 마일스톤 4에서 이미 구현된 `sellers.py`의 평점 집계(`review_count`/`average_rating`)가 실제 리뷰 데이터로 정상 반영되는 것까지 curl로 확인
- curl로 회원가입(구매자/판매자)→프로필→요청→견적→낙찰→리뷰 작성→중복 방지(409)→비소유자 거부(403)→목록 조회→판매자 프로필 평점 반영까지 전체 플로우 및 알림 레코드 생성 검증 완료

### 8. 관리자(신고/분쟁) API + 알림 API
- `POST /api/v1/reports`: 로그인한 사용자 누구나 신고 생성 (target_type: user/portfolio_post/service_request/review/chat_message)
- `POST /api/v1/disputes`: 서비스 요청의 구매자 또는 해당 요청에 견적을 제출한 판매자만 분쟁 제기 가능 (참여자 검증)
- `GET /api/v1/admin/reports`, `PATCH /api/v1/admin/reports/{id}`: 관리자 전용(`get_current_admin` 의존성, `admin_users` 테이블 확인), 상태 필터링 지원, `resolved`/`rejected`로 전이 시 `resolved_at` 자동 기록, 신고자에게 `report_update` 알림 발송
- `GET /api/v1/admin/disputes`, `PATCH /api/v1/admin/disputes/{id}`: 위와 동일한 패턴, `dispute_update` 알림 발송 (신규 `NotificationType` 추가 — 컬럼이 plain varchar라 마이그레이션 불필요)
- `GET /api/v1/notifications` (`unread_only` 쿼리 지원), `PATCH /api/v1/notifications/{id}/read`: 본인 알림만 조회/처리 가능 (소유자 아니면 404)
- curl로 신고 생성→비관리자 403→관리자 목록/처리(resolved_at 확인)→분쟁 생성(비참여자 403 확인)→관리자 처리→알림 목록/읽음 처리(타인 알림 접근 404 확인)까지 전체 플로우 검증 완료
- 테스트용으로 로컬 DB에 `admin_users` 레코드를 직접 insert하여 관리자 권한 검증 (실제 관리자 임명 API/절차는 범위 밖 — DB 직접 조작 또는 추후 시딩 스크립트로 처리)

### 9. 프론트엔드 Vite+React+TS+Tailwind 스캐폴딩
- `npm create vite@latest frontend -- --template react-ts` (React 19, Vite 8, TypeScript 6, oxlint) 후 Tailwind CSS v4(`@tailwindcss/vite` 플러그인, 별도 config 파일 불필요, `src/index.css`의 `@theme`로 커스텀 토큰 정의)
- 라이브러리 설치: `react-router-dom`, `@tanstack/react-query`, `axios`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@fontsource/pretendard`
- Pretendard 폰트(400/500/600/700 웨이트, `@fontsource/pretendard` 로컬 번들) + Orange 테마 컬러 토큰(`--color-primary-50~900`, `#F97316` 기준) `src/index.css`에 정의, 다크모드는 `prefers-color-scheme` 기반
- `vite.config.ts`에 `@` → `src` 경로 별칭, `tsconfig.app.json`에 대응 `paths` 설정
- `.env.example` 추가 (`VITE_API_BASE_URL=http://localhost:8001/api/v1`, `VITE_WS_BASE_URL`) — 백엔드와 동일하게 포트 8001 사용
- 기본 Vite 템플릿 데모 콘텐츠(react/vite 로고, hero 이미지 등) 제거하고 테마/폰트 적용을 확인하는 최소 placeholder(`App.tsx`)로 교체
- `npm run build`(tsc+vite build)와 `npm run lint`(oxlint) 통과 확인, `npm run dev`로 기동 후 curl로 HTML/CSS/폰트 번들 정상 서빙 확인
- **주의**: 이 개발 머신은 프론트 기본 포트 5173도 무관한 다른 서비스가 점유 중이라 Vite가 자동으로 5174로 폴백함(로그에 안내됨). 또한 Windows에서 Vite dev 서버가 `localhost`를 IPv6(`::1`)로만 바인드하는 경우가 있어 `127.0.0.1`로 접속이 안 되면 `[::1]:PORT`로 접속할 것

## 남은 마일스톤 (미착수)
10. 프론트엔드 공통 레이아웃/라우팅/API 클라이언트(axios+React Query)
11. 프론트엔드 화면: 인증 → 판매자/포트폴리오 → 서비스요청/견적 → 채팅 → 리뷰/관리자
12. 백엔드+프론트 동시 기동 후 브라우저로 골든 패스 e2e 확인

## 알려진 이슈 / TODO
- 소셜 로그인은 코드 골격만 있고 실제 Provider 앱 등록(client_id/secret) 전까지 테스트 불가 (501 응답)
- Apple OAuth의 id_token은 서명 검증 없이 디코드 중 — 프로덕션 전 서명 검증 추가 필요
- 파일 업로드는 이미지/동영상만 리사이즈·검증하며 바이러스 스캔 등은 없음 (로컬 개발 스코프)
