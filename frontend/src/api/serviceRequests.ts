import { apiClient } from './client'
import type {
  ServiceRequest,
  ServiceRequestCreateInput,
  ServiceRequestStatus,
  ServiceRequestSummary,
  ServiceRequestUpdateInput,
} from '@/types/serviceRequest'

export async function fetchServiceRequests(params?: {
  category_id?: string
  status?: ServiceRequestStatus
}): Promise<ServiceRequestSummary[]> {
  const { data } = await apiClient.get<ServiceRequestSummary[]>('/service-requests', { params })
  return data
}

export async function fetchMyServiceRequests(): Promise<ServiceRequestSummary[]> {
  const { data } = await apiClient.get<ServiceRequestSummary[]>('/service-requests/mine')
  return data
}

export async function fetchServiceRequest(id: string): Promise<ServiceRequest> {
  const { data } = await apiClient.get<ServiceRequest>(`/service-requests/${id}`)
  return data
}

export async function createServiceRequest(payload: ServiceRequestCreateInput): Promise<ServiceRequest> {
  const { data } = await apiClient.post<ServiceRequest>('/service-requests', payload)
  return data
}

export async function updateServiceRequest(id: string, payload: ServiceRequestUpdateInput): Promise<ServiceRequest> {
  const { data } = await apiClient.patch<ServiceRequest>(`/service-requests/${id}`, payload)
  return data
}

export async function cancelServiceRequest(id: string): Promise<ServiceRequest> {
  const { data } = await apiClient.post<ServiceRequest>(`/service-requests/${id}/cancel`)
  return data
}
