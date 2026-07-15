import type { UserPublic } from './user'

export interface Review {
  id: string
  service_request_id: string
  reviewer: UserPublic
  reviewee_id: string
  rating: number
  content: string
  created_at: string
}

export interface ReviewCreateInput {
  service_request_id: string
  rating: number
  content: string
}
