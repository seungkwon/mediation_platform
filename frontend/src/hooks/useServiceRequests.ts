import { useQuery } from '@tanstack/react-query'

import { fetchMyServiceRequests, fetchServiceRequest, fetchServiceRequests } from '@/api/serviceRequests'
import type { ServiceRequestStatus } from '@/types/serviceRequest'

export function useServiceRequests(filters?: { category_id?: string; status?: ServiceRequestStatus }) {
  return useQuery({
    queryKey: ['service-requests', filters],
    queryFn: () => fetchServiceRequests(filters),
  })
}

export function useMyServiceRequests() {
  return useQuery({
    queryKey: ['service-requests', 'mine'],
    queryFn: fetchMyServiceRequests,
  })
}

export function useServiceRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['service-request', id],
    queryFn: () => fetchServiceRequest(id!),
    enabled: !!id,
  })
}
