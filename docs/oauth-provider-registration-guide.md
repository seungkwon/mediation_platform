# 소셜 로그인 4사 앱 등록 가이드 (사이트 접속 → 메뉴 경로 → 입력값)

Callback URL 자체는 [oauth-callback-urls.md](./oauth-callback-urls.md)에 정리되어 있다. 이 문서는 각 콘솔 사이트에
**어떻게 들어가서 어떤 메뉴를 눌러 무엇을 입력**해야 하는지, 그리고 결과로 나온 값을 백엔드 `.env`
([`.env.example`](../backend/.env.example))의 어느 키에 넣어야 하는지를 정리한다.

---

## 1. 네이버 — [Naver Developers](https://developers.naver.com/apps)

1. 네이버 아이디로 로그인 후 **개발자 센터 접속**.
2. 상단 메뉴 **Application → 애플리케이션 등록**.
3. 등록 폼 입력
   - **애플리케이션 이름**: 네이버 로그인 화면에 노출되는 이름 (10자 내외 권장, 최대 40자)
   - **사용 API**: 목록에서 **"네이버 로그인"** 체크
   - **제공 정보 선택**: 이메일, 이름 등 앱에서 실제 쓰는 항목만 체크 (`oauth.py`에서 `email`, `name` 사용)
4. **서비스 환경 설정 (WEB)** 추가
   - **서비스 URL**: 서비스 메인 도메인 (로컬은 `http://localhost:5174`)
   - **Callback URL**: [oauth-callback-urls.md](./oauth-callback-urls.md) 표의 네이버 값
     - 로컬: `http://localhost:5174/oauth/callback/naver`
   - 로고 (140x140) png 등록
5. 휴대폰 또는 이메일 중 하나로 담당자 인증 후 **등록하기**.
6. 등록 완료 후 좌측에 생긴 애플리케이션 이름 서브 메뉴 → **개요** 탭에서 확인:
   - **Client ID** → `.env`의 `NAVER_CLIENT_ID`
   - **Client Secret** → `.env`의 `NAVER_CLIENT_SECRET`
7. 로컬 개발 중에는 애플리케이션 상태가 "개발중"이어도 등록된 네이버 아이디로는 테스트 로그인이 가능하다. 실서비스 전환 시 **API 설정 → 검수 신청**이 필요하다.

---

## 2. 카카오 — [Kakao Developers](https://developers.kakao.com/console/app)

1. 카카오 계정으로 로그인 후 **내 애플리케이션 → 애플리케이션 추가하기**.
2. 앱 이름/사업자명 입력 후 저장 → 생성된 앱 클릭해서 들어감.
3. **[앱] → [플랫폼 키] → [REST API 키]** 확인 → `.env`의 `KAKAO_CLIENT_ID`
   (이 프로젝트는 REST API 방식이므로 JavaScript 키가 아니라 REST API 키를 써야 한다.)
4. **[제품 설정] → [카카오 로그인] → [일반]**
   - **상태**를 **ON**으로 변경 (OFF면 로그인 시도 시 KOE004 에러)
5. **[제품 설정] → [카카오 로그인] → [Redirect URI]**
   - **URI 등록** 버튼으로 추가: `http://localhost:5174/oauth/callback/kakao` (운영은 실 도메인)
6. **[제품 설정] → [카카오 로그인] → [동의항목]**
   - **닉네임(profile_nickname)**만 "필수 동의" 또는 "선택 동의"로 설정하면 충분하다.
   - **카카오계정(이메일)**은 비즈 앱 전환(사업자 등록 심사) 없이는 신청 자체가 막혀 있는 경우가 많다. 이 프로젝트는 이메일 동의가 없어도 되도록 이미 설계되어 있으므로 **심사 없이 넘어가도 된다**:
     `oauth.py`가 이메일을 못 받아오면(`profile.email is None`) 에러 대신 `signup_required` 상태를 반환하고, 프론트의 [`OAuthCompleteSignup.tsx`](../frontend/src/routes/OAuthCompleteSignup.tsx)에서 사용자가 이메일을 직접 입력해 가입을 마무리한다 ([`auth.py:143`](../backend/app/api/v1/auth.py#L143) 참고).
   - 나중에 비즈 앱 전환이 완료되면 이메일 동의항목을 추가로 켜서 자동 입력되게 하면 된다 (당장 필수는 아님).
7. **[앱] → [플랫폼 키] → [REST API 키] → [클라이언트 시크릿]** → **코드 생성** → 발급된 값 → `.env`의 `KAKAO_CLIENT_SECRET`
   - 생성 후 **활성화 상태(ON)**로 바꿔야 실제로 사용됨.
   - (콘솔 버전에 따라 이 메뉴가 **[앱] → [보안]** 탭으로 표시되기도 한다 — 명칭은 달라도 REST API 키 화면 안에 있다.)

---

## 3. Google — [Google Cloud Console](https://console.cloud.google.com/)

Google은 2025~2026년에 걸쳐 콘솔이 **Google Auth Platform**(Google 인증 플랫폼)으로
개편되었다 (기존 "OAuth 동의 화면" 메뉴가 별도 섹션으로 분리).

1. 프로젝트 선택/생성 (없으면 상단 프로젝트 선택기에서 새 프로젝트 생성).
2. 좌측 메뉴 **API 및 서비스 → Google Auth Platform** (또는 "OAuth 동의 화면") 진입.
   - 처음이면 **"Get started"** 클릭 → 4단계 설정 마법사:
     1. **App Information**: 앱 이름, 지원 이메일
     2. **Audience**: **External** 선택 (일반 사용자 대상 서비스면 대부분 External)
     3. **Contact Information**: 개발자 연락 이메일
     4. **Finish**: 약관 동의
   - External 선택 시 앱은 "테스트" 모드로 시작하며, **Audience → Test users**에 등록한 구글 계정만 로그인 가능. 실서비스 오픈 전 **Publish App**으로 프로덕션 전환 필요(민감 스코프 없으면 검수 없이 가능).
3. 좌측 메뉴 **Google Auth Platform → Clients** (또는 **사용자 인증 정보/Credentials**) → **+ CREATE CLIENT**.
4. **애플리케이션 유형: 웹 애플리케이션(Web application)** 선택, 이름 입력.
5. **승인된 리디렉션 URI(Authorized redirect URIs)** 에 추가:
   - 로컬: `http://localhost:5174/oauth/callback/google`
   - (localhost는 HTTPS 예외로 http 허용, 운영 도메인은 반드시 https)
6. 생성 완료 후 뜨는 값:
   - **클라이언트 ID** → `.env`의 `GOOGLE_CLIENT_ID` (프론트 `VITE_GOOGLE_CLIENT_ID`에도 동일 값 필요)
   - **클라이언트 보안 비밀번호(Client Secret)** → `.env`의 `GOOGLE_CLIENT_SECRET`
7. **Data Access** 탭에서 `openid`, `email`, `profile` 스코프가 포함되어 있는지 확인 (`oauth.ts`의 `scope: 'openid email profile'`과 일치해야 함).

---

## 4. Apple — [Apple Developer](https://developer.apple.com/account)

Apple은 유료 개발자 계정($99/년)이 필요하며, 등록 절차가 가장 복잡하다. **App ID → Services ID → Key** 순서로 3개를 만들어야 한다.

### 4-1. Team ID 확인
- 로그인 후 우측 상단 계정 메뉴 또는 **Membership** 페이지에서 **Team ID** 확인 → `.env`의 `APPLE_TEAM_ID`

### 4-2. App ID 생성 (Sign in with Apple의 상위 식별자)
1. **Certificates, Identifiers & Profiles → Identifiers → (+)**
2. **App IDs → Continue → App** 선택
3. Description / Bundle ID 입력 (예: `com.yourcompany.mediation`)
4. **Capabilities** 목록에서 **Sign in with Apple** 체크 → Continue → Register

### 4-3. Services ID 생성 (실제 client_id + 콜백 도메인 등록)
1. **Identifiers → (+) → Services IDs → Continue**
2. Description 입력, **Identifier**에 역도메인 문자열 입력 (예: `com.yourcompany.mediation.web`)
   - 이 Identifier 값이 그대로 `.env`의 `APPLE_CLIENT_ID`가 된다.
3. Continue → Register로 일단 생성.
4. 생성된 Services ID 클릭 → **Sign in with Apple 체크 → Configure**
   - **Primary App ID**: 위 4-2에서 만든 App ID 선택
   - **Domains and Subdomains**: 백엔드 API 도메인 입력 (예: `api.mediation.example.com`, 로컬은 도메인 검증상 등록이 까다로움 — 하단 참고)
   - **Return URLs**: [oauth-callback-urls.md](./oauth-callback-urls.md)의 Apple 값
     - `https://api.mediation.example.com/api/v1/auth/apple/form-callback`
   - **Next → Done** → 상위 화면에서 **Continue → Save**

### 4-4. Key 생성 (client_secret 서명용 .p8 파일)
1. **Certificates, Identifiers & Profiles → Keys → (+)**
2. Key Name 입력, **Sign in with Apple** 체크 → **Configure** → Primary App ID로 4-2의 App ID 선택 → Save
3. Continue → Register → **Download** (⚠️ `.p8` 파일은 **딱 한 번만 다운로드 가능**, 분실 시 키를 재발급해야 함)
4. 다운로드한 파일을 백엔드 서버의 안전한 경로에 저장 → 그 경로를 `.env`의 `APPLE_PRIVATE_KEY_PATH`에 지정
5. 발급된 **Key ID**(10자리 영숫자) → `.env`의 `APPLE_KEY_ID`

### 4-5. 로컬 개발 시 주의
Apple Services ID는 HTTPS + 검증 가능한 도메인만 Return URL로 등록할 수 있어 `localhost`를 그대로 쓸 수 없다. 로컬에서 Apple 로그인까지 테스트하려면:
- ngrok 등으로 백엔드(`localhost:8001`)를 HTTPS 터널링
- 터널 도메인을 Services ID의 Domains/Return URL에 임시 등록
- 개발이 끝나면 운영 도메인으로 교체

---

## 등록 후 `.env` 체크리스트

| 변수 | 발급 위치 |
|---|---|
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | Naver Developers → 내 애플리케이션 → 개요 |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` | Kakao Developers → 앱 키(REST API 키) / 보안(Client Secret) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Google Auth Platform → Clients |
| `APPLE_CLIENT_ID` | Apple Developer → Services ID의 Identifier |
| `APPLE_TEAM_ID` | Apple Developer → Membership |
| `APPLE_KEY_ID` | Apple Developer → Keys |
| `APPLE_PRIVATE_KEY_PATH` | 다운로드한 `.p8` 파일을 저장한 서버 내 경로 |

프론트 쪽 `VITE_NAVER_CLIENT_ID` / `VITE_KAKAO_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` / `VITE_APPLE_CLIENT_ID`
([`oauth.ts`](../frontend/src/lib/oauth.ts))도 각각 위 표의 Client ID와 동일한 값으로 맞춰야 한다.
