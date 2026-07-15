import type { UserPublic } from './user'

export type ServiceRequestStatus = 'open' | 'awarded' | 'expired' | 'cancelled'

export interface ServiceRequestImage {
  id: string
  file_path: string
  sort_order: number
}

export interface ServiceRequestAttachment {
  id: string
  file_path: string
  original_filename: string
  size: number
}

export interface AttachmentInput {
  file_path: string
  original_filename: string
  size: number
}

export interface ServiceRequestCreateInput {
  title: string
  description: string
  category_id?: string | null
  budget_min?: number | null
  budget_max?: number | null
  bid_deadline: string
  image_paths?: string[]
  attachments?: AttachmentInput[]
}

export interface ServiceRequestUpdateInput {
  title?: string
  description?: string
  category_id?: string | null
  budget_min?: number | null
  budget_max?: number | null
  bid_deadline?: string
}

export interface ServiceRequestSummary {
  id: string
  title: string
  category_id: string | null
  budget_min: number | null
  budget_max: number | null
  bid_deadline: string
  status: ServiceRequestStatus
  quote_count: number
  created_at: string
}

export interface ServiceRequest {
  id: string
  buyer: UserPublic
  title: string
  description: string
  category_id: string | null
  budget_min: number | null
  budget_max: number | null
  bid_deadline: string
  status: ServiceRequestStatus
  selected_quote_id: string | null
  images: ServiceRequestImage[]
  attachments: ServiceRequestAttachment[]
  created_at: string
  updated_at: string
}
