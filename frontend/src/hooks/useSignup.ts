import { useMutation } from '@tanstack/react-query'

import { signup } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { SignupPayload } from '@/types/auth'

export function useSignup() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: SignupPayload) => signup(payload),
    onSuccess: (data) => {
      setAuth({ accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user })
    },
  })
}
