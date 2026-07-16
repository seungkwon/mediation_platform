import { apiClient } from './client'
import type {
  AdminRole,
  AdminUserSummary,
  Dispute,
  DisputeStatus,
  DisputeUpdateInput,
  Report,
  ReportStatus,
  ReportUpdateInput,
} from '@/types/admin'

export async function fetchReports(status?: ReportStatus): Promise<Report[]> {
  const { data } = await apiClient.get<Report[]>('/admin/reports', { params: status ? { status } : undefined })
  return data
}

export async function updateReport(id: string, payload: ReportUpdateInput): Promise<Report> {
  const { data } = await apiClient.patch<Report>(`/admin/reports/${id}`, payload)
  return data
}

export async function fetchDisputes(status?: DisputeStatus): Promise<Dispute[]> {
  const { data } = await apiClient.get<Dispute[]>('/admin/disputes', { params: status ? { status } : undefined })
  return data
}

export async function updateDispute(id: string, payload: DisputeUpdateInput): Promise<Dispute> {
  const { data } = await apiClient.patch<Dispute>(`/admin/disputes/${id}`, payload)
  return data
}

export async function fetchAdminUsers(search?: string): Promise<AdminUserSummary[]> {
  const { data } = await apiClient.get<AdminUserSummary[]>('/admin/users', { params: search ? { search } : undefined })
  return data
}

export async function fetchAdminUser(id: string): Promise<AdminUserSummary> {
  const { data } = await apiClient.get<AdminUserSummary>(`/admin/users/${id}`)
  return data
}

export async function grantAdminRole(id: string, role: AdminRole): Promise<AdminUserSummary> {
  const { data } = await apiClient.put<AdminUserSummary>(`/admin/users/${id}/admin-role`, { role })
  return data
}

export async function revokeAdminRole(id: string): Promise<AdminUserSummary> {
  const { data } = await apiClient.delete<AdminUserSummary>(`/admin/users/${id}/admin-role`)
  return data
}
