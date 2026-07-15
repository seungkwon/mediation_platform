import { apiClient } from './client'
import type { Notice, NoticeInput, NoticeSummary } from '@/types/notice'

export async function fetchNotices(): Promise<NoticeSummary[]> {
  const { data } = await apiClient.get<NoticeSummary[]>('/notices')
  return data
}

export async function fetchNotice(id: string): Promise<Notice> {
  const { data } = await apiClient.get<Notice>(`/notices/${id}`)
  return data
}

export async function createNotice(payload: NoticeInput): Promise<Notice> {
  const { data } = await apiClient.post<Notice>('/notices', payload)
  return data
}

export async function updateNotice(id: string, payload: Partial<NoticeInput>): Promise<Notice> {
  const { data } = await apiClient.patch<Notice>(`/notices/${id}`, payload)
  return data
}

export async function deleteNotice(id: string): Promise<void> {
  await apiClient.delete(`/notices/${id}`)
}
