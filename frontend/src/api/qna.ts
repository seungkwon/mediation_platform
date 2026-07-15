import { apiClient } from './client'
import type { QnaPost, QnaPostInput, QnaPostSummary } from '@/types/qna'

export async function fetchQnaPosts(): Promise<QnaPostSummary[]> {
  const { data } = await apiClient.get<QnaPostSummary[]>('/qna')
  return data
}

export async function fetchQnaPost(id: string): Promise<QnaPost> {
  const { data } = await apiClient.get<QnaPost>(`/qna/${id}`)
  return data
}

export async function createQnaPost(payload: QnaPostInput): Promise<QnaPost> {
  const { data } = await apiClient.post<QnaPost>('/qna', payload)
  return data
}

export async function updateQnaPost(id: string, payload: Partial<QnaPostInput>): Promise<QnaPost> {
  const { data } = await apiClient.patch<QnaPost>(`/qna/${id}`, payload)
  return data
}

export async function answerQnaPost(id: string, answer: string): Promise<QnaPost> {
  const { data } = await apiClient.patch<QnaPost>(`/qna/${id}/answer`, { answer })
  return data
}

export async function deleteQnaPost(id: string): Promise<void> {
  await apiClient.delete(`/qna/${id}`)
}
