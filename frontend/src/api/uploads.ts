import { apiClient } from './client'

export type UploadCategory =
  | 'profiles'
  | 'portfolios'
  | 'service_requests'
  | 'quotes'
  | 'chat'
  | 'notices'
  | 'qna'
  | 'faq'
  | 'resources'

export interface UploadResult {
  file_path: string
  url: string
  original_filename: string
  size: string
}

export async function uploadFile(category: UploadCategory, file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<UploadResult>(`/uploads/${category}`, formData)
  return data
}
