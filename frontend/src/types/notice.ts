import type { UserPublic } from './user'

export type NoticeStatus = 'draft' | 'published'

export interface Notice {
  id: string
  author: UserPublic
  title: string
  content: string
  status: NoticeStatus
  created_at: string
  updated_at: string
}

export interface NoticeSummary {
  id: string
  title: string
  status: NoticeStatus
  created_at: string
}

export interface NoticeInput {
  title: string
  content: string
  status: NoticeStatus
}
