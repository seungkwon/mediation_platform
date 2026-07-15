import { useQuery } from '@tanstack/react-query'

import { fetchMyQuotes, fetchQuotesForRequest } from '@/api/quotes'
import { useAuthStore } from '@/store/authStore'

export function useQuotesForRequest(requestId: string | undefined) {
  const accessToken = useAuthStore((state) => state.accessToken)
  return useQuery({
    queryKey: ['quotes', requestId],
    queryFn: () => fetchQuotesForRequest(requestId!),
    enabled: !!requestId && !!accessToken,
    retry: false,
  })
}

export function useMyQuotes() {
  return useQuery({
    queryKey: ['quotes', 'mine'],
    queryFn: fetchMyQuotes,
  })
}
