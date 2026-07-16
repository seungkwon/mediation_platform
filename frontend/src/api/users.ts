import { apiClient } from './client'
import type { UserMe, UserUpdateInput } from '@/types/user'

export async function updateMe(payload: UserUpdateInput): Promise<UserMe> {
  const { data } = await apiClient.patch<UserMe>('/users/me', payload)
  return data
}
