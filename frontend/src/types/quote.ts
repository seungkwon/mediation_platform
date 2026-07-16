import type { AttachmentInput } from './serviceRequest'
import type { UserPublic } from './user'

export type QuoteStatus = 'submitted' | 'opened' | 'selected' | 'rejected'

export interface QuoteAttachment {
  id: string
  file_path: string
  original_filename: string
}

export interface QuoteCreateInput {
  price: number
  delivery_days: number
  description: string
  attachments?: AttachmentInput[]
}

export interface Quote {
  id: string
  service_request_id: string
  service_request_title: string
  service_request_bid_deadline: string
  seller: UserPublic
  price: number | null
  delivery_days: number | null
  description: string | null
  status: QuoteStatus
  opened_at: string | null
  attachments: QuoteAttachment[]
  created_at: string
}
