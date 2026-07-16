# 소셜 로그인 Callback(Redirect) URL 등록 가이드

이 프로젝트의 소셜 로그인은 **프론트가 매 요청마다 `redirect_uri`를 계산해서 백엔드로 함께 전달**하는 구조다
([`oauth.ts`](../frontend/src/lib/oauth.ts)). 백엔드는 `.env`에 redirect_uri를 별도로 저장하지 않는다
([`config.py`](../backend/app/core/config.py) 주석 참고). 따라서 각 Provider 콘솔에는 **프론트가 실제로 보내는 값과 정확히 일치하는 URL**을 등록해야 한다.

Apple만 예외로, 백엔드가 콜백을 직접 받는다 (아래 참고).

## 로컬 개발 환경 (`http://localhost:5174`)

| Provider | 등록할 Callback(Redirect) URI |
|---|---|
| 네이버 | `http://localhost:5174/oauth/callback/naver` |
| 카카오 | `http://localhost:5174/oauth/callback/kakao` |
| Google | `http://localhost:5174/oauth/callback/google` |
| Apple | `http://localhost:8001/api/v1/auth/apple/form-callback` |

프론트 개발 서버 포트를 바꾸면(`vite.config.ts` 등) 네이버/카카오/구글 3개는 그에 맞춰 같이 바꿔야 한다.
Apple은 프론트 포트와 무관하게 백엔드 주소(`VITE_API_BASE_URL`의 origin) 고정이다.

## 운영/스테이징 환경

`FRONTEND_ORIGIN`(백엔드 `.env`)이 실제 배포 도메인으로 바뀌면, 콜백 URL도 그 도메인 기준으로 등록한다.

| Provider | 등록할 Callback(Redirect) URI |
|---|---|
| 네이버 | `https://{FRONTEND_ORIGIN}/oauth/callback/naver` |
| 카카오 | `https://{FRONTEND_ORIGIN}/oauth/callback/kakao` |
| Google | `https://{FRONTEND_ORIGIN}/oauth/callback/google` |
| Apple | `https://{API_ORIGIN}/api/v1/auth/apple/form-callback` |

- `{FRONTEND_ORIGIN}`: 프론트가 실제로 서빙되는 도메인 (예: `mediation.example.com`)
- `{API_ORIGIN}`: 백엔드 API 도메인 (예: `api.mediation.example.com`) — 프론트 도메인과 다를 수 있음에 주의

## Provider별 등록 위치

- **네이버**: [Naver Developers](https://developers.naver.com/apps) → 애플리케이션 등록/수정 → "서비스 URL" / "네이버 로그인 Callback URL"
- **카카오**: [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 카카오 로그인 → Redirect URI
- **Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 클라이언트 ID → 승인된 리디렉션 URI
- **Apple**: [Apple Developer](https://developer.apple.com/account/resources/identifiers/list/serviceId) → Services ID → "Return URLs" (Sign in with Apple 설정 내)
  - Apple Services ID 등록 시 **Domains and Subdomains**에는 백엔드 API 도메인(`{API_ORIGIN}`)을 넣어야 한다.

## Apple만 콜백이 다른 이유

`name`/`email` 스코프를 요청하면 Apple은 `response_mode=form_post`를 강제하고, 콜백을 GET이 아닌 POST(form body)로 보낸다.
SPA(프론트)는 POST body를 직접 받을 수 없으므로, 백엔드가 `/api/v1/auth/apple/form-callback`에서 대신 POST를 받아
`code`/`state`를 쿼리스트링으로 옮겨 프론트의 `/oauth/callback/apple` 라우트로 302 리다이렉트한다.
([`auth.py`](../backend/app/api/v1/auth.py) `apple_form_callback` 참고)

그래서 Apple Services ID의 Return URL은 **프론트 주소가 아니라 백엔드 주소**로 등록해야 한다.

## 로컬 개발 시 주의사항

- 네이버/카카오/Apple은 `http://localhost` 콜백 등록을 지원하지만, Google은 `localhost`만 허용하고 `127.0.0.1`은 별도 등록이 필요할 수 있다 — 프론트를 정확히 `localhost:5174`로 접속해야 한다.
- Apple Services ID는 HTTPS 도메인 검증이 필요해 `localhost`를 그대로 등록할 수 없는 경우가 많다. 로컬에서 Apple 로그인까지 테스트하려면 ngrok 등으로 백엔드를 HTTPS 터널링한 뒤, 그 터널 주소를 Return URL로 임시 등록하는 방법을 권장한다.
