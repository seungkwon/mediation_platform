import { useQuery } from '@tanstack/react-query'

import { fetchNotice, fetchNotices } from '@/api/notices'

export function useNotices() {
  return useQuery({ queryKey: ['notices'], queryFn: fetchNotices })
}

export function useNotice(id: string | undefined) {
  return useQuery({
    queryKey: ['notice', id],
    queryFn: () => fetchNotice(id!),
    enabled: !!id,
  })
}
