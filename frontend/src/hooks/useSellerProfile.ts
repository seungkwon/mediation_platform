import { useQuery } from '@tanstack/react-query'

import { fetchSellerProfile, fetchSellers } from '@/api/sellers'

export function useSellers(filters?: { category_id?: string }) {
  return useQuery({
    queryKey: ['sellers', filters],
    queryFn: () => fetchSellers(filters),
  })
}

export function useSellerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['seller-profile', userId],
    queryFn: () => fetchSellerProfile(userId!),
    enabled: !!userId,
    retry: false,
  })
}
