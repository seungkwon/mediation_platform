import { useQuery } from '@tanstack/react-query'

import { fetchQnaPost, fetchQnaPosts } from '@/api/qna'

export function useQnaPosts() {
  return useQuery({ queryKey: ['qna'], queryFn: fetchQnaPosts })
}

export function useQnaPost(id: string | undefined) {
  return useQuery({
    queryKey: ['qna', id],
    queryFn: () => fetchQnaPost(id!),
    enabled: !!id,
  })
}
