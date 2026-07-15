import { apiClient } from './client'
import type { LoginPayload, OAuthCallbackResult, SignupPayload, SocialProvider, TokenResponse } from '@/types/auth'

export async function signup(payload: SignupPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/signup', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload)
  return data
}

export async function oauthCallback(
  provider: SocialProvider,
  code: string,
  redirectUri: string,
): Promise<OAuthCallbackResult> {
  const { data } = await apiClient.post<OAuthCallbackResult>(`/auth/${provider}/callback`, {
    provider,
    code,
    redirect_uri: redirectUri,
  })
  return data
}

export async function oauthLinkConfirm(
  provider: SocialProvider,
  linkToken: string,
  password: string,
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>(`/auth/${provider}/link-confirm`, {
    link_token: linkToken,
    password,
  })
  return data
}

export async function oauthCompleteSignup(
  provider: SocialProvider,
  signupToken: string,
  payload: { email: string; name: string; phone?: string },
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>(`/auth/${provider}/complete-signup`, {
    signup_token: signupToken,
    ...payload,
  })
  return data
}
