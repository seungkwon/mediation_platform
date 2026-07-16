import { useMutation } from '@tanstack/react-query'

import { updateMe } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import type { UserUpdateInput } from '@/types/user'

export function useUpdateMe() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: UserUpdateInput) => updateMe(payload),
    onSuccess: (_data, payload) => {
      if (!user) return
      setUser({
        ...user,
        name: payload.name ?? user.name,
        phone: payload.phone === undefined ? user.phone : payload.phone,
        profile_image_path: payload.profile_image_path === undefined ? user.profile_image_path : payload.profile_image_path,
      })
    },
  })
}
