# 중계 플랫폼 상세 설계 (DetailedPlan)

> 본 문서는 [Plan.md](./Plan.md)의 요구사항과 아래 확정된 스코프 결정을 바탕으로 작성한 상세 설계서입니다.

## 0. 스코프 결정 사항 (사용자 확인 완료)

| 항목 | 결정 |
|---|---|
| 결제/정산 | **제외**. 이번 설계는 매칭(견적/선택)까지만 다루며, 실제 대금 지급은 플랫폼 외부(당사자 간)에서 처리. 추후 PG/에스크로 연동 확장 여지를 남겨둠 |
| 채팅 | **실시간 채팅 포함** (WebSocket 기반 1:1 채팅) |
| 파일 저장 | **로컬 서버 파일시스템** 저장 (S3 등 클라우드 연동은 하지 않음) |
| 부가 기능 | **리뷰/평점 + 관리자(신고/분쟁 처리)** 포함 |

---

## 1. 핵심 사용자 플로우

### 1.1 역할 모델
- 하나의 계정(User)이 **판매자(Seller)이자 구매자(Buyer)**로 동시에 활동 가능
- 판매자 활동을 하려면 `SellerProfile`을 추가로 생성해야 함 (프로필 없이는 견적 제출/포트폴리오 작성 불가)
- 구매자 활동은 별도 프로필 없이 User 자체로 가능

### 1.2 역경매(견적 요청) 플로우
1. 구매자가 서비스 요청(`ServiceRequest`) 작성 — 제목, 설명, 카테고리, 예산 범위, 텍스트/이미지, 첨부파일, **입찰 마감시간(bid_deadline)** 지정
2. 판매자들이 요청을 열람하고 견적(`Quote`)을 제출 (가격, 작업기간, 제안내용, 첨부파일) — 제출된 견적은 기본적으로 **비공개(sealed)** 상태
3. 구매자는 마감시간 전까지 제출된 견적 목록(견적자·요약 정보)을 확인할 수 있고, 관심 있는 후보의 견적을 **오픈(open)**하여 상세 내용 확인
4. 구매자는 **마감시간 이전에** 후보 중 하나를 **최종 선택(select)** — 선택 시 해당 요청은 `awarded` 상태로 전환, 나머지 견적은 자동 `rejected`
5. 마감시간까지 선택하지 않으면 요청은 `expired` 상태로 전환 (판매자 재견적/재등록 불가, 구매자는 재등록 가능)
6. 최종 선택 이후 구매자-판매자 간 채팅방이 활성화되어 세부 협의 진행 (요청 등록 시부터 문의성 채팅은 가능하도록 허용 — 아래 6장 참고)
7. 거래(오프라인 진행) 완료 후 구매자가 리뷰/평점 작성 가능

### 1.3 포트폴리오 플로우
- 판매자는 `SellerProfile`에 소개/경력 정보를 등록하고, 여러 개의 `PortfolioPost`(블로그형 게시물)를 작성
- 게시물은 Rich Text 에디터(Tiptap)로 작성 — 텍스트 작성 중 원하는 위치에 이미지/동영상을 바로 삽입해 하나의 `content`(HTML)로 저장 (별도 미디어 목록 테이블 없음)
- 게시물은 초안(draft)/게시(published) 상태 관리

---

## 2. 시스템 아키텍처

```
┌───────────────────────┐        HTTPS/REST, WS        ┌───────────────────────────┐
│  Frontend (Vite React) │ ───────────────────────────▶ │  Backend (FastAPI)          │
│  - 로컬 5173 포트 실행   │ ◀─────────────────────────── │  - 로컬 8000 포트 실행       │
└───────────────────────┘                               │  - REST API + WebSocket     │
                                                          │  - 로컬 파일 업로드 저장(/uploads)│
                                                          └───────────┬────────────────┘
                                                                      │ SQLAlchemy (asyncpg)
                                                                      ▼
                                                          ┌───────────────────────────┐
                                                          │ PostgreSQL (Docker 컨테이너) │
                                                          └───────────────────────────┘
```

- 프론트엔드/백엔드는 도커 없이 로컬 프로세스로 실행 (개발 편의성)
- PostgreSQL만 Docker Compose로 관리 (데이터 영속성 볼륨 포함)
- 정적 업로드 파일은 백엔드가 `/uploads` 경로에 저장하고 `/static` 라우트로 서빙, DB에는 상대 경로만 저장

---

## 3. 기술 스택 상세

### 프론트엔드
- React 18 + Vite + TypeScript
- Tailwind CSS, 폰트: **Pretendard** (`@fontsource/pretendard` 또는 CDN)
- 컬러 테마: Orange 계열 (Tailwind `orange-500` `#F97316`를 Primary로, `orange-600/700`을 hover/active로 확장)
- 라우팅: React Router v6
- 서버 상태: TanStack Query (React Query)
- 폼: React Hook Form + Zod
- 클라이언트 상태(전역 UI 상태): Zustand
- 실시간: 네이티브 WebSocket 클라이언트 (채팅용)
- 반응형: Tailwind breakpoint 기준 모바일 퍼스트 설계 (`sm/md/lg/xl`)

### 백엔드
- Python 3.12 + FastAPI
- ORM: SQLAlchemy 2.0 (async, `asyncpg` 드라이버)
- 스키마/검증: Pydantic v2
- 마이그레이션: Alembic
- 인증: `python-jose`(JWT) + `passlib[bcrypt]`(비밀번호 해시)
- 소셜 로그인: `httpx`로 각 Provider OAuth2 Authorization Code 플로우 직접 구현 (Naver/Kakao/Google/Apple)
- WebSocket: FastAPI 내장 WebSocket 지원
- 파일 업로드: `python-multipart`, 로컬 디스크 저장 + Pillow(이미지 유효성 검사/썸네일)

### 인프라
- Docker Compose: PostgreSQL 16 컨테이너 (볼륨 마운트로 데이터 유지)
- 백엔드/프론트엔드: `.env` 기반 로컬 실행 (`uvicorn`, `npm run dev`)

---

## 4. 데이터베이스 설계

### 4.1 사용자/인증

**users**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| email | varchar unique | |
| password_hash | varchar nullable | 소셜 전용 계정은 null |
| name | varchar | |
| phone | varchar nullable | |
| profile_image_path | varchar nullable | |
| is_active | bool default true | |
| created_at / updated_at | timestamptz | |

**social_accounts**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| user_id | FK → users | |
| provider | enum(naver, kakao, google, apple) | |
| provider_user_id | varchar | |
| created_at | timestamptz | |
| unique(provider, provider_user_id) | | 중복 연동 방지 |

### 4.2 판매자/포트폴리오

**seller_profiles**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| user_id | FK → users, unique | |
| headline | varchar | 한줄 소개 |
| bio | text | 상세 소개 |
| category_id | FK → categories nullable | 주력 카테고리 |
| career_years | int nullable | |
| created_at / updated_at | timestamptz | |

**portfolio_posts**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| seller_profile_id | FK | |
| title | varchar | |
| content | text (HTML, Rich Text 에디터로 생성 — 이미지/동영상이 `data-file-path` 속성으로 본문에 인라인 포함) | |
| status | enum(draft, published) | |
| created_at / updated_at | timestamptz | |

> `portfolio_media` 테이블은 폐지됨 (이미지/동영상이 `content`에 통합되며, 목록 썸네일은 `content`에서 첫 이미지를 파싱해 추출)

### 4.3 카테고리

**categories**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| name | varchar | |
| parent_id | FK → categories nullable | 대/중분류 |

### 4.4 서비스 요청 / 견적 (역경매)

**service_requests**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| buyer_id | FK → users | |
| title | varchar | |
| description | text | |
| category_id | FK → categories | |
| budget_min / budget_max | int nullable | |
| bid_deadline | timestamptz | 입찰/선택 마감시간 |
| status | enum(open, awarded, expired, cancelled) | |
| selected_quote_id | FK → quotes nullable | |
| created_at / updated_at | timestamptz | |

**service_request_images / service_request_attachments**
- 요청 1개에 여러 이미지·첨부파일 (file_path, original_filename, size, sort_order)

**quotes**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| service_request_id | FK | |
| seller_id | FK → users | |
| price | int | |
| delivery_days | int | |
| description | text | |
| status | enum(submitted, opened, selected, rejected) | |
| opened_at | timestamptz nullable | 구매자가 오픈한 시각 |
| created_at | timestamptz | |
| unique(service_request_id, seller_id) | | 판매자당 1건 견적 |

**quote_attachments**: quote_id, file_path, original_filename

### 4.5 채팅

**chat_rooms**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| service_request_id | FK | |
| buyer_id | FK → users | |
| seller_id | FK → users | |
| created_at | timestamptz | |
| unique(service_request_id, seller_id) | | 요청당 판매자별 1개 방 |

**chat_messages**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| chat_room_id | FK | |
| sender_id | FK → users | |
| message_type | enum(text, image, file) | |
| content | text nullable | |
| file_path | varchar nullable | |
| read_at | timestamptz nullable | |
| created_at | timestamptz | |

### 4.6 리뷰 / 관리자

**reviews**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| service_request_id | FK | |
| reviewer_id | FK → users | |
| reviewee_id | FK → users | |
| rating | int (1~5) | |
| content | text | |
| created_at | timestamptz | |
| unique(service_request_id, reviewer_id) | | 요청당 1회 |

**reports** (신고)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| reporter_id | FK → users | |
| target_type | enum(user, portfolio_post, service_request, review, chat_message) | |
| target_id | UUID | |
| reason | text | |
| status | enum(pending, reviewing, resolved, rejected) | |
| admin_note | text nullable | |
| created_at / resolved_at | timestamptz | |

**disputes** (분쟁)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| service_request_id | FK | |
| raised_by | FK → users | |
| description | text | |
| status | enum(open, in_review, resolved) | |
| admin_note | text nullable | |
| created_at / resolved_at | timestamptz | |

**admin_users**: user_id FK, role enum(super_admin, moderator)

**notifications**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| user_id | FK | |
| type | enum(new_quote, quote_opened, quote_selected, deadline_soon, new_message, new_review, report_update) | |
| title / content | varchar / text | |
| link | varchar nullable | 프론트 라우트 |
| is_read | bool default false | |
| created_at | timestamptz | |

---

## 5. 인증/인가 설계

- **자체 로그인**: 이메일+비밀번호(bcrypt 해시), 회원가입 시 이메일 인증(선택적, 최초 버전은 생략 가능)
- **소셜 로그인**: Naver / Kakao / Google / Apple — Authorization Code Grant
  - 프론트에서 각 Provider 인증 페이지로 리다이렉트 → callback에서 code 수신 → 백엔드 `/auth/{provider}/callback`에 code 전달
  - 백엔드가 code→token 교환, 사용자 정보 조회 후 `social_accounts` 매칭/신규 유저 생성
  - 이메일이 없는 Provider(카카오 등 동의 항목 미제공 시) 대응: 임시 이메일 발급 또는 최초 로그인 시 이메일 입력 유도
- **토큰**: JWT Access Token(단기, 30분) + Refresh Token(장기, 14일, httpOnly 쿠키 저장)
- **인가**: 요청 소유자/판매자 여부는 API 레벨에서 검증 (예: 견적 오픈/선택은 해당 요청의 buyer만 가능), 관리자 API는 `admin_users` 확인 dependency로 분리

---

## 6. 핵심 기능 상세 설계

### 6.1 서비스 요청 & 역경매 상태 머신
```
open ──(구매자가 후보 선택)──▶ awarded
open ──(마감시간 도과, 미선택)──▶ expired   (배치/lazy 평가: 조회 시점에 마감시간 체크 후 상태 전이)
open ──(구매자가 취소)──▶ cancelled
```
- 마감시간 자동 전이는 별도 스케줄러 없이 **조회 시 lazy evaluation** (요청 조회 API에서 `now > bid_deadline`이면 상태를 `expired`로 업데이트) 방식으로 우선 구현 — 추후 필요 시 Celery/APScheduler 도입

### 6.2 견적 오픈/선택 규칙
- 판매자는 견적 제출 후 수정 가능(마감 전까지), 재제출 시 기존 건 업데이트
- 구매자는 목록에서 견적자 요약(가격대, 판매자 평점)만 우선 노출 → "오픈" 클릭 시 상세 내용 공개 및 `opened_at` 기록 (판매자에게 "견적이 열람됨" 알림)
- 최종 선택 시 트랜잭션으로 해당 quote → `selected`, 나머지 → `rejected`, request → `awarded` 동시 처리

### 6.3 실시간 채팅
- WebSocket 엔드포인트: `/ws/chat/{room_id}?token=<JWT>`
- 채팅방 생성 시점: 판매자가 특정 요청에 견적을 제출하는 순간 자동 생성 (문의/협의 가능하도록), 최종 선택 여부와 무관하게 존재
- 서버는 방별 연결을 in-memory ConnectionManager로 관리(단일 프로세스 기준) — 메시지 수신 시 DB 저장 후 상대방에게 브로드캐스트, 미접속 시 `notifications`로 대체 알림
- 이미지/파일 메시지는 REST 업로드 API로 먼저 업로드 후 file_path를 WS 메시지에 포함

### 6.4 리뷰
- `awarded` 상태의 요청에 한해, 구매자가 선택된 판매자에게 리뷰 작성 가능 (양방향 리뷰는 1차 버전에서는 구매자→판매자만; 확장 여지로 스키마는 reviewer/reviewee 양방향 지원)
- 판매자 프로필에 평균 평점/리뷰 수 집계 표시

### 6.5 관리자(신고/분쟁)
- 신고 대상: 사용자, 포트폴리오 게시물, 서비스 요청, 리뷰, 채팅 메시지
- 관리자 대시보드에서 상태별(pending/reviewing) 필터, 처리 메모 남기고 resolved 처리
- 분쟁은 거래(서비스 요청) 단위로 별도 관리, 상태 변경 시 당사자에게 알림 발송

---

## 7. API 설계 개요 (REST, prefix `/api/v1`)

| 리소스 | 엔드포인트 |
|---|---|
| 인증 | `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET/POST /auth/{provider}/callback` |
| 사용자 | `GET/PATCH /users/me`, `GET /users/{id}` |
| 판매자 프로필 | `POST/GET/PATCH /sellers/me`, `GET /sellers/{id}` |
| 포트폴리오 | `POST/GET/PATCH/DELETE /portfolios` (본문에 이미지/동영상 인라인 포함, 별도 미디어 엔드포인트 없음) |
| 카테고리 | `GET /categories` |
| 서비스 요청 | `POST/GET/PATCH/DELETE /service-requests`, `GET /service-requests/{id}` |
| 견적 | `POST /service-requests/{id}/quotes`, `GET /service-requests/{id}/quotes`, `POST /quotes/{id}/open`, `POST /quotes/{id}/select` |
| 채팅 | `GET /chat/rooms`, `GET /chat/rooms/{id}/messages`, `WS /ws/chat/{room_id}` |
| 리뷰 | `POST /reviews`, `GET /users/{id}/reviews` |
| 신고/분쟁 | `POST /reports`, `POST /disputes`, `GET /admin/reports`, `PATCH /admin/reports/{id}` |
| 업로드 | `POST /uploads` (범용 파일 업로드, 카테고리별 저장 경로 분리) |
| 알림 | `GET /notifications`, `PATCH /notifications/{id}/read` |

---

## 8. 프론트엔드 설계

### 8.1 라우트 구조
```
/                       홈 (카테고리별 판매자·포트폴리오 노출, 최근 요청)
/login, /signup
/oauth/callback/:provider
/sellers/:id            판매자 프로필 + 포트폴리오 리스트
/portfolios/new, /portfolios/:id/edit
/requests                서비스 요청(역경매) 목록
/requests/new
/requests/:id            요청 상세 (설명, 첨부, 견적 목록/오픈/선택)
/my/requests              내가 등록한 요청 관리
/my/quotes                 내가 제출한 견적 관리
/chat                       채팅방 목록
/chat/:roomId
/my/reviews
/admin, /admin/reports, /admin/disputes
```

### 8.2 디자인 시스템
- 폰트: Pretendard (font-family 전역 적용)
- Primary Color: Orange (`#F97316`) / Hover `#EA580C` / Light bg `#FFF7ED`
- 컴포넌트: 카드형 리스트(요청/포트폴리오), 반응형 그리드 (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- 모바일 우선 브레이크포인트 설계, 채팅은 모바일에서 풀스크린 전환

---

## 9. 파일 저장 구조 (로컬)

```
backend/uploads/
  profiles/{user_id}/...
  portfolios/{portfolio_id}/...
  service_requests/{request_id}/...
  quotes/{quote_id}/...
  chat/{room_id}/...
```
- 백엔드는 `/static` 경로로 uploads 디렉터리를 서빙, DB에는 상대 경로 저장
- 업로드 시 확장자/MIME 검증, 이미지 최대 용량 제한(예: 10MB), 동영상 별도 제한(예: 100MB)
- `uploads/`는 `.gitignore` 처리

---

## 10. 인프라 / 실행 방식

**docker-compose.yml (Postgres 전용)**
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: mediation
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: mediation_platform
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

- 백엔드 실행: `uvicorn app.main:app --reload` (로컬, `.env`로 DB 접속정보 주입)
- 프론트엔드 실행: `npm run dev` (Vite, 로컬)

---

## 11. 프로젝트 폴더 구조

```
mediation_platform/
  Plan.md
  DetailedPlan.md
  docker/
    docker-compose.yml
    .env.example
  backend/
    app/
      main.py
      core/            # config, security(jwt/oauth)
      db/              # session, base
      models/          # SQLAlchemy 모델
      schemas/         # Pydantic 스키마
      api/v1/          # 라우터 (auth, users, sellers, portfolios, service_requests, quotes, chat, reviews, admin, categories, uploads)
      services/         # 도메인 로직 (매칭 상태 전이, 알림 발송 등)
      ws/                # ConnectionManager
    alembic/
    uploads/            # 업로드 파일 (gitignore)
    tests/
    pyproject.toml
    .env.example
  frontend/
    src/
      routes/ (pages)
      components/
      features/         # auth, sellers, requests, quotes, chat, reviews, admin
      hooks/
      api/               # axios/query client
      store/
      styles/
    index.html
    vite.config.ts
    tailwind.config.ts
    .env.example
```

---

## 12. 개발 로드맵 (제안)

| 단계 | 범위 |
|---|---|
| 0. 기반 구축 | 레포 구조, Docker Postgres, FastAPI/Vite 스캐폴딩, CI 없이 로컬 개발 환경 확정 |
| 1. 인증 | 자체 회원가입/로그인, JWT, 소셜 로그인 4종 |
| 2. 판매자/포트폴리오 | SellerProfile, 포트폴리오 CRUD + 미디어 업로드 |
| 3. 역경매 코어 | ServiceRequest CRUD, Quote 제출/오픈/선택, 상태 머신 |
| 4. 채팅 | WebSocket 채팅방, 메시지 이력, 알림 연동 |
| 5. 리뷰/평점 | 리뷰 작성/집계, 프로필 노출 |
| 6. 관리자 | 신고/분쟁 대시보드, 처리 플로우 |
| 7. 마감 & 반응형 정리 | 전 화면 반응형 QA, 알림 UX, 에러 처리 |

---

## 13. 향후 확장 고려사항 (이번 범위 제외)
- PG 연동 결제/에스크로, 수수료 정산
- 클라우드 오브젝트 스토리지(S3 등) 전환
- 이메일/푸시 알림 발송 (현재는 인앱 알림 테이블만)
- 검색/추천 고도화(Elasticsearch 등)
- 다국어 지원
