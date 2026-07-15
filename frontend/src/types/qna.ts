import type { UserPublic } from './user'

export type QnaStatus = 'unanswered' | 'answered'

export interface QnaPost {
  id: string
  author: UserPublic
  title: string
  content: string
  status: QnaStatus
  answer: string | null
  answered_at: string | null
  created_at: string
  updated_at: string
}

export interface QnaPostSummary {
  id: string
  title: string
  status: QnaStatus
  created_at: string
}

export interface QnaPostInput {
  title: string
  content: string
}
