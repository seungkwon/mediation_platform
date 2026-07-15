import { useQuery } from '@tanstack/react-query'

import { fetchSellerProfile } from '@/api/sellers'

export function useSellerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['seller-profile', userId],
    queryFn: () => fetchSellerProfile(userId!),
    enabled: !!userId,
    retry: false,
  })
}
