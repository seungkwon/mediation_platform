import { apiClient } from './client'
import type { FaqPost, FaqPostInput, FaqPostSummary } from '@/types/faq'

export async function fetchFaqPosts(): Promise<FaqPostSummary[]> {
  const { data } = await apiClient.get<FaqPostSummary[]>('/faq')
  return data
}

export async function fetchFaqPost(id: string): Promise<FaqPost> {
  const { data } = await apiClient.get<FaqPost>(`/faq/${id}`)
  return data
}

export async function createFaqPost(payload: FaqPostInput): Promise<FaqPost> {
  const { data } = await apiClient.post<FaqPost>('/faq', payload)
  return data
}

export async function updateFaqPost(id: string, payload: Partial<FaqPostInput>): Promise<FaqPost> {
  const { data } = await apiClient.patch<FaqPost>(`/faq/${id}`, payload)
  return data
}

export async function deleteFaqPost(id: string): Promise<void> {
  await apiClient.delete(`/faq/${id}`)
}
