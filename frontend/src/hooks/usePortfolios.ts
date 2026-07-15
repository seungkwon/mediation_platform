import { useQuery } from '@tanstack/react-query'

import { fetchPortfolio, fetchPortfoliosBySeller } from '@/api/portfolios'

export function usePortfoliosBySeller(sellerId: string | undefined) {
  return useQuery({
    queryKey: ['portfolios', sellerId],
    queryFn: () => fetchPortfoliosBySeller(sellerId!),
    enabled: !!sellerId,
  })
}

export function usePortfolio(id: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => fetchPortfolio(id!),
    enabled: !!id,
  })
}
