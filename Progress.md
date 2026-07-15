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

### 10. 프론트엔드 공통 레이아웃/라우팅/API 클라이언트
- `src/api/client.ts`: axios 인스턴스(`VITE_API_BASE_URL`), 요청 인터셉터로 zustand 스토어의 accessToken 부착, 응답 인터셉터로 401 시 `/auth/refresh` 1회 자동 재시도(동시 다발 401은 in-flight `refreshPromise` 하나로 합침) 후 실패하면 로그아웃 처리
- `src/store/authStore.ts`: zustand `persist` 미들웨어로 accessToken/refreshToken/user를 localStorage에 저장
- `src/routes/router.tsx`: `createBrowserRouter`로 DetailedPlan 8.1의 라우트 전체 스켈레톤 구성 (`RootLayout` 아래 인증/판매자/포트폴리오/요청/견적/채팅/리뷰/관리자 라우트), 보호 라우트는 `RequireAuth`(accessToken 없으면 `/login`으로 redirect, `state.from`으로 복귀 경로 보존)
- `src/components/layout/{Header,Footer,RootLayout}.tsx`: 반응형 헤더(모바일 햄버거 메뉴, `md` 이상에서 가로 네비게이션), 로그인 상태에 따라 로그인/회원가입 또는 사용자명/로그아웃 표시
- 화면 자체는 아직 placeholder(`PagePlaceholder` 컴포넌트)이며, 실제 폼/데이터 화면은 마일스톤 11에서 구현 예정 — 다만 `Home.tsx`는 `GET /categories`를 React Query(`useCategories`)로 실제 연동해 API 클라이언트 배관이 정상 동작하는지 확인하는 용도로 구현
- **버그 발견 및 수정**: 프론트 개발 서버가 이 머신에서 5173 포트 충돌로 5174로 폴백하는데, 백엔드 `CORSMiddleware`가 `frontend_origin`(기본값 `http://localhost:5173`) 단일 origin만 허용하고 있어 실제 브라우저에서 API 호출 시 CORS preflight가 400으로 막히는 문제를 발견 (`backend/app/main.py`) → `allow_origin_regex=r"http://localhost:\d+"`를 추가해 로컬 개발 중 임의 포트의 localhost origin을 허용하도록 수정, curl로 preflight(OPTIONS)와 실제 GET 응답의 `access-control-allow-origin` 헤더 확인 완료
- 검증: `npm run build`/`npm run lint` 통과, `npm run dev`로 기동 후 Vite가 변환한 각 신규 모듈(`main.tsx`, `router.tsx`, `client.ts`, `authStore.ts`, `Home.tsx`, `Header.tsx`, `RequireAuth.tsx`)이 200으로 정상 서빙되는지, 백엔드 `/categories`가 프론트 origin으로부터 CORS 헤더와 함께 정상 응답하는지 curl로 확인
- **주의**: 이 환경에는 브라우저 자동화 도구가 없어 실제 브라우저 렌더링(라우팅 전환, 폼 상호작용, 반응형 레이아웃 육안 확인)은 수행하지 못했음 — 다음 세션에서 사람이 직접 `npm run dev`로 브라우저 확인 권장

### 11. 프론트엔드 화면 (진행 중 — 인증 화면 완료)
- `src/api/auth.ts`(signup/login 호출), `src/hooks/{useLogin,useSignup}.ts`(React Query mutation, 성공 시 `authStore.setAuth`로 토큰/유저 저장)
- `src/components/common/TextField.tsx`: react-hook-form `register()`와 바로 스프레드 가능한 공용 input 컴포넌트 (label+error 메시지 포함, React 19라 `forwardRef` 불필요)
- `src/lib/errors.ts`: axios 에러에서 백엔드 `{detail: string}` 메시지를 추출하는 헬퍼
- `Login.tsx`: react-hook-form + zod 검증, 로그인 성공 시 `RequireAuth`가 넘겨준 `location.state.from`으로 복귀(없으면 `/`)
- `Signup.tsx`: 이름/이메일/비밀번호(8자 이상)/전화번호(선택) 검증, 가입 즉시 로그인 처리(백엔드가 가입 시 토큰도 함께 발급)
- 소셜 로그인 버튼은 아직 미구현 — 백엔드가 Provider 앱 미등록으로 501을 반환하는 상태라 실제 동작 가능한 UI를 만들 수 없어 보류 (알려진 이슈 참고)
- 검증: `npm run build`/`npm run lint` 통과, `npm run dev`로 신규 모듈 200 서빙 확인, curl로 프론트 origin에서 회원가입(201)→중복가입(409)→오답 로그인(401)→정상 로그인(200) 응답 바디가 프론트 TS 타입(`TokenResponse`/`UserMe`) 및 `extractErrorMessage`가 기대하는 `{detail}` 형태와 정확히 일치하는지 확인

**판매자/포트폴리오 화면 추가 완료**
- `src/api/{sellers,portfolios,uploads}.ts`, `src/hooks/{useSellerProfile,usePortfolios}.ts`, `src/lib/media.ts`(정적 파일은 `/api/v1` 없는 origin의 `/static/...`이라 API base URL에서 접미사를 벗겨내는 헬퍼)
- `SellerProfilePage.tsx`(`/sellers/:id`): 프로필 없고 본인이면 등록 폼, 있으면 조회 화면(본인이면 "프로필 수정" 토글로 같은 폼 재사용) + 포트폴리오 그리드(본인만 초안 포함 전체 노출, 클릭 시 수정 페이지로 이동은 소유자만 — 방문자용 상세 열람 라우트는 DetailedPlan에 없어 미구현)
- `SellerProfileForm.tsx`(등록/수정 공용), `PortfolioForm.tsx` + `MediaUploader.tsx`(파일 선택 → `/uploads/portfolios` 즉시 업로드 → `file_path`를 폼 상태에 누적, 확장자로 image/video 자동 판별)
- `PortfolioNew.tsx`/`PortfolioEdit.tsx`(수정 화면에 삭제 버튼 포함), Header에 로그인 시 "판매자 프로필" 내비게이션 링크 추가
- **버그 발견 및 수정**: `PATCH /portfolios/{id}`가 500 에러 발생 — `db.refresh(post, attribute_names=["media"])`가 `updated_at`(서버 계산 `onupdate` 컬럼)을 갱신 목록에서 빠뜨려 응답 직렬화 시점에 만료된 속성을 동기적으로 지연로드하려다 `MissingGreenlet` 에러 발생 (`backend/app/api/v1/portfolios.py`) → `attribute_names=["media", "updated_at"]`로 수정, 수정 전/후 curl로 500→200 확인. (`create_portfolio`의 동일 패턴은 INSERT라 RETURNING으로 이미 채워져 있어 문제없음을 확인)
- 검증: `npm run build`/`npm run lint` 통과, 신규 모듈 전체 200 서빙 확인, curl로 실제 화면이 수행할 전체 시퀀스를 재현 — 기존 판매자 프로필 조회, 이미지 업로드(`/uploads/portfolios`) → 포트폴리오 생성(미디어 포함) → 목록에 썸네일 반영 → 정적 파일 서빙(`/static/...`) 200 확인 → 수정(버그 발견/수정) → 비소유자 403 → 삭제(204) → 신규 유저 판매자 프로필 미존재(404) → 등록(201) → 재조회(200) 전 과정이 프론트 TS 타입과 정확히 일치
- 남은 화면: 서비스요청/견적(역경매 핵심 플로우), 채팅(WebSocket), 리뷰, 관리자(신고/분쟁) — 다음 세션에서 이어서 진행

## 남은 마일스톤 (미착수)
12. 백엔드+프론트 동시 기동 후 브라우저로 골든 패스 e2e 확인

## 알려진 이슈 / TODO
- 소셜 로그인은 코드 골격만 있고 실제 Provider 앱 등록(client_id/secret) 전까지 테스트 불가 (501 응답)
- Apple OAuth의 id_token은 서명 검증 없이 디코드 중 — 프로덕션 전 서명 검증 추가 필요
- 파일 업로드는 이미지/동영상만 리사이즈·검증하며 바이러스 스캔 등은 없음 (로컬 개발 스코프)
