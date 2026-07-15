import { useQuery } from '@tanstack/react-query'

import { fetchFaqPost, fetchFaqPosts } from '@/api/faq'

export function useFaqPosts() {
  return useQuery({ queryKey: ['faq'], queryFn: fetchFaqPosts })
}

export function useFaqPost(id: string | undefined) {
  return useQuery({
    queryKey: ['faq', id],
    queryFn: () => fetchFaqPost(id!),
    enabled: !!id,
  })
}
