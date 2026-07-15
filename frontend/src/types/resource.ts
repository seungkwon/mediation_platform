import type { AttachmentInput } from '@/components/common/MultiFileUploader'

import type { UserPublic } from './user'

export type ResourceStatus = 'draft' | 'published'

export interface ResourceAttachment extends AttachmentInput {
  id: string
  sort_order: number
}

export interface ResourcePost {
  id: string
  author: UserPublic
  title: string
  content: string
  status: ResourceStatus
  attachments: ResourceAttachment[]
  created_at: string
  updated_at: string
}

export interface ResourcePostSummary {
  id: string
  title: string
  status: ResourceStatus
  attachment_count: number
  created_at: string
}

export interface ResourcePostInput {
  title: string
  content: string
  status: ResourceStatus
  attachments: (AttachmentInput & { sort_order: number })[]
}
