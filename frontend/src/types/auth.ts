import type { UserMe } from './user'

export interface SignupPayload {
  email: string
  password: string
  name: string
  phone?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: UserMe
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
}

export type SocialProvider = 'naver' | 'kakao' | 'google' | 'apple'

export type OAuthCallbackResult =
  | { status: 'issued'; access_token: string; refresh_token: string; token_type: string; user: UserMe }
  | { status: 'link_required'; link_token: string; masked_email: string }
  | { status: 'signup_required'; signup_token: string; provider: SocialProvider }
