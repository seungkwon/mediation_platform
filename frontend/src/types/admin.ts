export type ReportTargetType = 'user' | 'portfolio_post' | 'service_request' | 'review' | 'chat_message'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected'
export type DisputeStatus = 'open' | 'in_review' | 'resolved'

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  status: ReportStatus
  admin_note: string | null
  created_at: string
  resolved_at: string | null
}

export interface ReportUpdateInput {
  status: ReportStatus
  admin_note?: string | null
}

export interface Dispute {
  id: string
  service_request_id: string
  raised_by: string
  description: string
  status: DisputeStatus
  admin_note: string | null
  created_at: string
  resolved_at: string | null
}

export interface DisputeUpdateInput {
  status: DisputeStatus
  admin_note?: string | null
}
