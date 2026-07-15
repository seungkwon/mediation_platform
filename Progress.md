# 진행 상황 (Progress)

> 마일스톤이 끝날 때마다 이 문서를 갱신합니다. 새 세션에서 작업을 이어갈 때는 이 문서와 [DetailedPlan.md](./DetailedPlan.md)를 먼저 참고하세요.

## 실행 환경 메모
- 패키지 매니저: 백엔드 `uv` (backend/pyproject.toml, uv.lock)
- DB: `docker/docker-compose.yml`로 Postgres 기동 (`cd docker && docker compose up -d`)
- 백엔드 로컬 실행: `cd backend && uv run uvicorn app.main:app --reload --port 8001`
  - **주의**: 이 개발 머신에서 포트 8000은 이 프로젝트와 무관한 다른 서비스가 이미 점유 중이라 테스트는 8001로 진행함. 실제 배포/사용 시에는 포트 정책을 다시 확인할 것.
- 백엔드 `.env`는 `backend/.env.example` 복사해서 사용 (`DATABASE_URL`이 `docker/.env`의 값과 일치해야 함)
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

## 남은 마일스톤 (미착수)
7. 리뷰 API (`/api/v1/reviews`)
8. 관리자(신고/분쟁) API (`/api/v1/admin/...`), 알림 API (`/api/v1/notifications`)
9. 프론트엔드 Vite+React+TS+Tailwind 스캐폴딩 (Pretendard 폰트, Orange 테마)
10. 프론트엔드 공통 레이아웃/라우팅/API 클라이언트(axios+React Query)
11. 프론트엔드 화면: 인증 → 판매자/포트폴리오 → 서비스요청/견적 → 채팅 → 리뷰/관리자
12. 백엔드+프론트 동시 기동 후 브라우저로 골든 패스 e2e 확인

## 알려진 이슈 / TODO
- 소셜 로그인은 코드 골격만 있고 실제 Provider 앱 등록(client_id/secret) 전까지 테스트 불가 (501 응답)
- Apple OAuth의 id_token은 서명 검증 없이 디코드 중 — 프로덕션 전 서명 검증 추가 필요
- 파일 업로드는 이미지/동영상만 리사이즈·검증하며 바이러스 스캔 등은 없음 (로컬 개발 스코프)
