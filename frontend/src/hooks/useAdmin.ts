import { useQuery } from '@tanstack/react-query'

import { fetchAdminUser, fetchAdminUsers, fetchDisputes, fetchReports } from '@/api/admin'
import type { DisputeStatus, ReportStatus } from '@/types/admin'

export function useReports(status?: ReportStatus) {
  return useQuery({ queryKey: ['admin-reports', status], queryFn: () => fetchReports(status) })
}

export function useDisputes(status?: DisputeStatus) {
  return useQuery({ queryKey: ['admin-disputes', status], queryFn: () => fetchDisputes(status) })
}

export function useAdminUsers(search?: string) {
  return useQuery({ queryKey: ['admin-users', search], queryFn: () => fetchAdminUsers(search) })
}

export function useAdminUser(id?: string) {
  return useQuery({ queryKey: ['admin-users', id], queryFn: () => fetchAdminUser(id!), enabled: !!id })
}
