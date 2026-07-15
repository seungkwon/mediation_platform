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

### 11. 프론트엔드 화면 (완료)
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

**서비스요청/견적(역경매 핵심 플로우) 화면 추가 완료**
- `src/types/{serviceRequest,quote}.ts`, `src/api/{serviceRequests,quotes}.ts`, `src/hooks/{useServiceRequests,useQuotes}.ts`
- `src/components/common/StatusBadge.tsx`(요청/견적 상태 공용 배지), `src/lib/format.ts`(날짜/통화 포맷)
- `RequestsList.tsx`(`/requests`): 카테고리 필터 + 카드 그리드, `RequestNew.tsx`(`/requests/new`): 제목/설명/카테고리/예산/입찰마감(`datetime-local`→ISO 변환)/파일 업로드(확장자로 이미지·첨부파일 자동 분류, `/uploads/service_requests` 사용)
- `RequestDetail.tsx`(`/requests/:id`): 상세 정보 + 이미지/첨부 표시, 구매자면 취소 버튼, 판매자(프로필 보유 + `open` 상태)면 견적 제출/수정 폼, 구매자면 견적 목록에서 오픈/선택 버튼 — 견적 목록 조회는 로그인 시에만 시도(비참여자 403은 조용히 무시)
- `MyRequests.tsx`(`/my/requests`): 내 요청 목록 + 취소, `MyQuotes.tsx`(`/my/quotes`): 내가 제출한 견적 목록 + 요청 바로가기
- **버그 2건 발견 및 수정** (모두 `backend/app/api/v1/service_requests.py`):
  1. `GET /service-requests`, `GET /service-requests/mine` 둘 다 500 에러 — `ServiceRequest`↔`Quote`는 `quotes.service_request_id`와 `service_requests.selected_quote_id` 두 개의 FK 경로가 있어 `.outerjoin(Quote)`가 SQLAlchemy `AmbiguousForeignKeysError`를 던짐 → `.outerjoin(Quote, Quote.service_request_id == ServiceRequest.id)`로 조인 조건 명시. 마일스톤 5에서 curl 검증한 건 `{id}/quotes`(견적 목록)였고 요청 자체 목록(`/service-requests`, `/mine`)은 실제로 호출된 적이 없어 지금까지 발견되지 않았던 것으로 보임
- 검증: `npm run build`/`npm run lint` 통과, 신규 모듈 전체 200 서빙 확인, curl로 실제 화면 시퀀스 재현 — 요청 생성 → 목록 조회(버그 발견/수정) → 견적 제출 → 구매자 시점 sealed 마스킹(price/delivery_days/description null) 확인 → 판매자 시점 언마스킹 확인 → 오픈 → 선택 → 요청 상태 `awarded` 전이 확인 → `/quotes/mine` 확인 → 취소 플로우 + 비소유자 403 확인, 전 구간 프론트 TS 타입과 정확히 일치
- 남은 화면: 채팅(WebSocket), 리뷰, 관리자(신고/분쟁) — 다음 세션에서 이어서 진행

**채팅(WebSocket) 화면 추가 완료**
- `src/types/chat.ts`, `src/api/chat.ts`(REST: 방 목록/메시지 이력), `src/hooks/{useChatRooms,useChatMessages}.ts`
- `src/hooks/useChatSocket.ts`: `VITE_WS_BASE_URL` + accessToken으로 `/ws/chat/{roomId}` 연결, roomId/accessToken 변경 시에만 재연결(`onMessage` 콜백은 ref로 보관해 재연결 루프 방지), 연결 상태(`connected`)와 `sendMessage` 제공
- `ChatList.tsx`(`/chat`): 내 채팅방 목록, 상대방(구매자/판매자 중 나 아닌 쪽) 이름·마지막 메시지·요청 제목 표시
- `ChatRoomPage.tsx`(`/chat/:roomId`): REST로 이력 로드 후 WS로 실시간 수신 메시지를 별도 상태에 추가해 병합, 서버가 발신자 본인에게도 echo를 보내는 구조(마일스톤 6)에 맞춰 낙관적 업데이트 없이 echo만으로 자기 메시지 렌더링(id 기준 중복 방지), 말풍선 좌우 정렬로 내 메시지/상대 메시지 구분
- 검증: `npm run build`/`npm run lint` 통과, 신규 모듈 전체 200 서빙 확인, 기존 `tests/manual_ws_test.py`(milestone 6에서 작성된 WS 클라이언트 스크립트)를 재사용해 REST(`/chat/rooms`, `/chat/rooms/{id}/messages`)와 WS 메시지 교환을 함께 검증 — 응답/수신 페이로드가 프론트 `ChatMessage`/`ChatRoom` 타입과 정확히 일치, 메시지 전송 후 방 목록의 `last_message`/`last_message_at`도 갱신됨을 확인. 이번엔 백엔드 버그 없이 통과
- 남은 화면: 리뷰, 관리자(신고/분쟁) — 다음 세션에서 이어서 진행

**리뷰 / 관리자(신고·분쟁) 화면 추가 완료 — 마일스톤 11 전체 완료**
- `src/types/{review,admin}.ts`, `src/api/{reviews,admin}.ts`, `src/hooks/{useReviews,useAdmin}.ts`
- `MyReviews.tsx`(`/my/reviews`): 내 낙찰 완료 요청 중 아직 리뷰를 안 쓴 것도 서버에 물어보지 않고 일단 모두 노출 → 작성 시도 시 중복이면 백엔드 409를 `extractErrorMessage`로 그대로 노출(별도 "이미 작성함" 사전 조회 없이 재사용), 내가 받은 리뷰 목록(별점 `★` 반복 렌더링) 함께 표시
- `AdminReports.tsx`/`AdminDisputes.tsx`(`/admin/reports`, `/admin/disputes`): 상태 필터 + 카드별 처리 메모 입력 후 상태 전이 버튼(신고: pending/reviewing/resolved/rejected, 분쟁: open/in_review/resolved), 비관리자 403은 "관리자 권한이 필요합니다" 안내로 처리 — 관리자 임명은 마일스톤 8과 동일하게 DB 직접 조작 필요
- `StatusBadge`에 report/dispute 상태 라벨·색상 추가(pending/reviewing/resolved/in_review) — `open`은 서비스요청과 의미가 겹치지만 라벨("진행중")이 분쟁에도 무난히 맞아 재사용
- **스코프 결정**: 신고/분쟁 "생성" UI(신고하기 버튼 등)는 이번 화면 구현에서 제외 — 신고 대상이 사용자/포트폴리오/요청/리뷰/채팅메시지 등 여러 화면에 흩어져 있어 각 화면에 신고 버튼을 붙이는 작업은 범위가 커서, 이번엔 관리자 대시보드(조회/처리)만 구현. 백엔드 `POST /reports`, `POST /disputes`는 이미 동작하며 curl로 검증 완료(마일스톤 8)
- 검증: `npm run build`/`npm run lint` 통과, 신규 모듈 전체 200 서빙 확인, curl로 리뷰 작성→목록 반영, 관리자 신고/분쟁 조회·상태변경·비관리자 403 전부 프론트 타입과 정확히 일치 확인 (버그 없음)

**포트폴리오 Rich Text 에디터 전환 + 판매자 탐색 기능 추가**
- **배경**: 기존 포트폴리오 작성은 `content`(plain textarea) + `PortfolioMedia` 테이블(이미지/동영상을 파일별로 업로드해 본문과 분리된 그리드로 표시)이 분리되어 있어, 글 중간에 사진/영상을 배치할 수 없었음. Tiptap 기반 Rich Text 에디터로 전환해 텍스트 작성 중 원하는 위치에 이미지/동영상을 바로 삽입하도록 변경
- **데이터 구조 변경**: `PortfolioMedia` 테이블/모델/스키마 완전 제거, 이미지·동영상도 `content`(HTML) 안에 커스텀 노드로 인라인 저장. 이미지/동영상은 절대 URL이 아니라 `data-file-path`(상대 경로)로 저장하고 표시 시점에 `mediaUrl()`로 변환 — 기존 코드베이스의 "상대 경로 저장, 렌더 시 변환" 컨벤션 유지. 목록 API의 썸네일은 `PortfolioMedia`가 없어졌으므로 본문 HTML에서 첫 `<img data-file-path>`를 정규식으로 추출해서 채움
  - `backend/app/models/seller.py`, `schemas/seller.py`, `api/v1/portfolios.py` 수정, `backend/alembic/versions/45ab23d926d9_drop_portfolio_media.py` 신규(portfolio_media 테이블 drop)
  - `frontend/src/components/portfolio/{RichTextEditor.tsx,richTextExtensions.ts}` 신규, `MediaUploader.tsx` 삭제, `PortfolioForm.tsx`/`types/seller.ts` 단순화
- **에디터 기능**: 굵게/기울임/제목/목록/정렬(좌·가운데·우, 이미지·동영상 포함) + 이미지/동영상 삽입(`/uploads/portfolios` 재사용) + 드래그로 이미지/동영상 크기 조절(코너 핸들, `data-width`로 저장) + 표(삽입, 행·열 추가/삭제, 셀 병합/분할, 컬럼 너비 드래그 리사이즈, **선택한 셀 범위 기준**으로 좌/우/상/하/내부 변 지정 후 테두리 색상·두께 적용, 셀 배경색). 테두리 두께 0(없음)은 읽기 모드에서는 안 보이고 편집 모드에서만 빨간 점선 가이드로 표시. 에디터 툴바는 `sticky`로 항상 화면에 보이도록 처리
  - Tiptap의 내장 resizable 테이블 NodeView가 커스텀 속성 변경을 안정적으로 반영하지 않는 문제가 있어, 셀 단위 테두리/배경은 기본 스키마 렌더링(반응성 보장)을 쓰는 `TableCell`/`TableHeader` 확장으로, 표 자체가 아니라 `selectedRect()`(`@tiptap/pm/tables`)로 계산한 선택 셀 범위에 직접 트랜잭션을 적용하는 방식으로 구현(`applyCellBorders`/`applyCellBackground`, `richTextExtensions.ts`)
  - 셀 드래그 선택이 "안 되는 것처럼" 보였던 원인은 실제로는 선택이 되고 있었으나 `.selectedCell` 하이라이트 CSS가 없었던 것 — `index.css`에 추가
- **판매자 탐색 기능 신규**: 기존엔 판매자 목록/검색 페이지가 전혀 없고 `/sellers/:id`(단건 조회)만 존재해 구매자가 판매자를 발견할 방법이 없었음 (헤더 메뉴의 "판매자 프로필"은 로그인한 "본인" 프로필로만 연결)
  - 백엔드: `GET /sellers`(목록, `category_id` 선택 필터, 리뷰 집계 포함) 신규 추가 (`backend/app/api/v1/sellers.py`)
  - 프론트: `frontend/src/routes/SellersList.tsx`(`/sellers`) 신규, `Header.tsx`에 "판매자 찾기" 메뉴 추가
  - 구매자가 서비스 신청 여부와 무관하게 포트폴리오 전문을 읽을 수 있도록 `frontend/src/routes/PortfolioDetail.tsx`(`/portfolios/:id`, 읽기 전용) 신규 — 백엔드 `GET /portfolios/{id}`는 이미 게시물 상태만 확인하고 공개로 내려주고 있어 백엔드 변경 불필요, `RichTextEditor`에 `readOnly` 모드를 추가해 재사용. `SellerProfilePage.tsx`의 포트폴리오 카드도 비소유자 클릭 시 이 페이지로 연결되도록 수정(기존엔 클릭해도 반응 없었음)
  - 포트폴리오 목록 카드 썸네일이 `object-cover`로 잘려 보이던 것을 `object-contain`(+회색 레터박스)으로 변경해 이미지 전체가 보이도록 수정
- 검증: `npm run build`(tsc)/`npm run lint`(oxlint) 통과, `alembic upgrade head` 적용 확인, 로컬 dev 서버(백엔드 8001 `--reload`, 프론트 5174) 기동 후 신규/변경 모듈이 HMR로 에러 없이 반영되는 것과 `GET /sellers`, `GET /portfolios/{id}` 응답을 curl로 확인 — 이 환경엔 브라우저 자동화 도구가 없어 실제 드래그 리사이즈/셀 병합/테두리 적용 등 마우스 상호작용은 사용자가 직접 브라우저에서 확인함

**게시판 4종 신규 추가: 공지사항 / 질문답변(QnA) / FAQ / 자료실**
- **배경**: 포트폴리오용 Rich Text 에디터를 재사용해 성격이 다른 4개 게시판 추가. 공지사항·FAQ·자료실은 관리자만 CRUD, QnA는 구매자/판매자 누구나 질문 작성(본인 글만 수정) + 관리자만 답변(질문 1개당 답변 1개, 재답변은 덮어쓰기), 자료실은 첨부파일 다수 등록(파일당 최대 500MB). 4개 게시판 모두 로그인 사용자만 열람 가능
- **관리자 플래그 신규 노출**: 기존엔 프론트가 "이 유저가 관리자인지" 판별할 방법이 전혀 없었음(`UserMe`에 role 필드 0건) → `backend/app/api/deps.py`에 `is_admin(db, user)` 헬퍼 추가(기존 `get_current_admin`도 이걸 재사용하도록 리팩터), `_build_user_me()`(`api/v1/auth.py`)에서 `UserMe.is_admin` 채움, `frontend/src/types/user.ts`에 반영
- **RichTextEditor 공용화**: `frontend/src/components/portfolio/{RichTextEditor.tsx,richTextExtensions.ts}` → `frontend/src/components/richtext/`로 이동. Tiptap 노드 이름을 `portfolioImage`/`portfolioVideo` → `richImage`/`richVideo`로 변경(노드 이름은 저장 HTML에 나타나지 않고 `data-file-path` 태그만 저장되므로 기존 포트폴리오 데이터와 100% 호환), `uploadCategory` prop을 추가해 게시판별 업로드 카테고리를 지정하도록 일반화
- **업로드 확장**: `backend/app/api/v1/uploads.py`의 `UploadCategory`에 `notices`/`qna`/`faq`/`resources` 추가, `resources` 카테고리는 `max_resource_size_mb`(500, `core/config.py`) 별도 한도 적용, 문서 확장자에 `.ppt/.pptx/.txt/.csv/.rar` 추가
- **게시판별 구현** (`models/{notice,qna,faq,resource}.py`, `schemas/*`, `api/v1/*`, `frontend/src/{types,api,hooks,components,routes}` 각각 4종): 공지사항·FAQ는 거의 동일한 구조(제목/richtext 본문/draft·published 상태, 관리자 전용), QnA는 `answer`/`answered_at` 필드 + `PATCH /qna/{id}/answer`(관리자 전용) 분리, 자료실은 `ResourcePost`+`ResourceAttachment`(1:N, `QuoteAttachment`/`ServiceRequestAttachment`와 동일 패턴) 구조로 신규 `MultiFileUploader.tsx` 컴포넌트(`RequestNew.tsx`의 다중 업로드 로직을 범용 컴포넌트로 추출) 사용
- 신규 Alembic 마이그레이션(`fba0383b9eb3`)으로 `notices`/`qna_posts`/`faq_posts`/`resource_posts`/`resource_attachments` 5개 테이블 생성. **참고**: `alembic revision --autogenerate`가 매번 `service_requests.selected_quote_id`의 순환 FK(`use_alter=True`)를 "새로 추가된 FK"로 잘못 감지하는 기존 알려진 오탐이 있어(이번 변경과 무관, 마일스톤 2 때부터 존재하는 구조), 생성된 마이그레이션 파일에서 해당 라인은 수동으로 제거함
- 헤더에 "공지사항/질문답변/FAQ/자료실" 메뉴 4개 추가(로그인 시에만 노출), 16개 프론트 라우트 등록(게시판당 목록/상세/작성/수정, 전부 `RequireAuth`)
- 검증: `npm run build`/`npm run lint` 통과, `alembic upgrade head` 적용 후 5개 테이블 생성과 SQLAlchemy `configure_mappers()` 정상 확인, 백엔드 재기동 후 신규 4개 엔드포인트가 401(인증 필요)로 정상 응답하는 것 확인 — 실제 관리자 계정으로 로그인해 작성/수정/답변/첨부파일 업로드를 누르는 것은 사용자가 직접 확인 필요(이 환경엔 브라우저 자동화 도구 없음)

## 남은 마일스톤 (미착수)
12. 백엔드+프론트 동시 기동 후 브라우저로 골든 패스 e2e 확인

## 알려진 이슈 / TODO
- 소셜 로그인은 코드 골격만 있고 실제 Provider 앱 등록(client_id/secret) 전까지 테스트 불가 (501 응답)
- Apple OAuth의 id_token은 서명 검증 없이 디코드 중 — 프로덕션 전 서명 검증 추가 필요
- 파일 업로드는 이미지/동영상만 리사이즈·검증하며 바이러스 스캔 등은 없음 (로컬 개발 스코프)
