import { useQuery } from '@tanstack/react-query'

import { fetchDisputes, fetchReports } from '@/api/admin'
import type { DisputeStatus, ReportStatus } from '@/types/admin'

export function useReports(status?: ReportStatus) {
  return useQuery({ queryKey: ['admin-reports', status], queryFn: () => fetchReports(status) })
}

export function useDisputes(status?: DisputeStatus) {
  return useQuery({ queryKey: ['admin-disputes', status], queryFn: () => fetchDisputes(status) })
}
