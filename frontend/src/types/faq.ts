import type { UserPublic } from './user'

export type FaqStatus = 'draft' | 'published'

export interface FaqPost {
  id: string
  author: UserPublic
  title: string
  content: string
  status: FaqStatus
  created_at: string
  updated_at: string
}

export interface FaqPostSummary {
  id: string
  title: string
  status: FaqStatus
  created_at: string
}

export interface FaqPostInput {
  title: string
  content: string
  status: FaqStatus
}
