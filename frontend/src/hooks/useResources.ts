import { useQuery } from '@tanstack/react-query'

import { fetchResourcePost, fetchResourcePosts } from '@/api/resources'

export function useResourcePosts() {
  return useQuery({ queryKey: ['resources'], queryFn: fetchResourcePosts })
}

export function useResourcePost(id: string | undefined) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => fetchResourcePost(id!),
    enabled: !!id,
  })
}
