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
