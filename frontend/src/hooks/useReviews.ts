import { useQuery } from '@tanstack/react-query'

import { fetchUserReviews } from '@/api/reviews'

export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
  })
}
