import { apiClient } from './client'
import type { ResourcePost, ResourcePostInput, ResourcePostSummary } from '@/types/resource'

export async function fetchResourcePosts(): Promise<ResourcePostSummary[]> {
  const { data } = await apiClient.get<ResourcePostSummary[]>('/resources')
  return data
}

export async function fetchResourcePost(id: string): Promise<ResourcePost> {
  const { data } = await apiClient.get<ResourcePost>(`/resources/${id}`)
  return data
}

export async function createResourcePost(payload: ResourcePostInput): Promise<ResourcePost> {
  const { data } = await apiClient.post<ResourcePost>('/resources', payload)
  return data
}

export async function updateResourcePost(id: string, payload: Partial<ResourcePostInput>): Promise<ResourcePost> {
  const { data } = await apiClient.patch<ResourcePost>(`/resources/${id}`, payload)
  return data
}

export async function deleteResourcePost(id: string): Promise<void> {
  await apiClient.delete(`/resources/${id}`)
}
