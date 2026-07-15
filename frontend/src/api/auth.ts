import { apiClient } from './client'
import type { LoginPayload, SignupPayload, TokenResponse } from '@/types/auth'

export async function signup(payload: SignupPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/signup', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload)
  return data
}
