import { useMutation } from '@tanstack/react-query'

import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginPayload } from '@/types/auth'

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      setAuth({ accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user })
    },
  })
}
