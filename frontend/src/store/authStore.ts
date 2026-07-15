import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UserMe } from '@/types/user'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserMe | null
  setAuth: (tokens: { accessToken: string; refreshToken: string; user: UserMe }) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: UserMe) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'mediation-auth' },
  ),
)
