import type { SocialProvider } from '@/types/auth'

interface ProviderConfig {
  label: string
  authorizeUrl: string
  scope?: string
  extraParams?: Record<string, string>
}

const apiBaseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api/v1'
const apiOrigin = apiBaseURL.replace(/\/api\/v1\/?$/, '')

export const SOCIAL_PROVIDERS: SocialProvider[] = ['naver', 'kakao', 'google', 'apple']

const PROVIDERS: Record<SocialProvider, ProviderConfig> = {
  naver: { label: '네이버', authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize' },
  kakao: { label: '카카오', authorizeUrl: 'https://kauth.kakao.com/oauth/authorize' },
  google: {
    label: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
  },
  apple: {
    // 애플은 name/email 스코프 요청 시 response_mode=form_post가 강제되며,
    // 그 콜백은 프론트가 아니라 백엔드 브릿지(/auth/apple/form-callback)로 받는다.
    label: 'Apple',
    authorizeUrl: 'https://appleid.apple.com/auth/authorize',
    scope: 'name email',
    extraParams: { response_mode: 'form_post' },
  },
}

const CLIENT_IDS: Record<SocialProvider, string | undefined> = {
  naver: import.meta.env.VITE_NAVER_CLIENT_ID,
  kakao: import.meta.env.VITE_KAKAO_CLIENT_ID,
  google: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  apple: import.meta.env.VITE_APPLE_CLIENT_ID,
}

export function labelFor(provider: SocialProvider): string {
  return PROVIDERS[provider].label
}

export function clientIdFor(provider: SocialProvider): string | null {
  const value = CLIENT_IDS[provider]
  return value && value.length > 0 ? value : null
}

function redirectUriFor(provider: SocialProvider): string {
  if (provider === 'apple') {
    return `${apiOrigin}/api/v1/auth/apple/form-callback`
  }
  return `${window.location.origin}/oauth/callback/${provider}`
}

function pendingStorageKey(provider: SocialProvider): string {
  return `oauth_pending_${provider}`
}

export interface PendingOAuth {
  state: string
  redirectUri: string
}

/** 인가 URL을 만들고, 콜백에서 state/redirect_uri를 검증·재사용할 수 있도록 sessionStorage에 저장한다. */
export function buildAuthorizeUrl(provider: SocialProvider): string | null {
  const clientId = clientIdFor(provider)
  if (!clientId) return null

  const config = PROVIDERS[provider]
  const redirectUri = redirectUriFor(provider)
  const state = crypto.randomUUID()
  const pending: PendingOAuth = { state, redirectUri }
  sessionStorage.setItem(pendingStorageKey(provider), JSON.stringify(pending))

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    ...(config.scope ? { scope: config.scope } : {}),
    ...(config.extraParams ?? {}),
  })
  return `${config.authorizeUrl}?${params.toString()}`
}

/** 콜백 화면에서 1회 소비. 저장된 값이 없거나 state가 다르면 null. */
export function consumePendingOAuth(provider: SocialProvider, receivedState: string | null): PendingOAuth | null {
  const key = pendingStorageKey(provider)
  const raw = sessionStorage.getItem(key)
  sessionStorage.removeItem(key)
  if (!raw) return null
  try {
    const pending = JSON.parse(raw) as PendingOAuth
    if (!receivedState || pending.state !== receivedState) return null
    return pending
  } catch {
    return null
  }
}
