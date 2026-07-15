import type { UserPublic } from './user'

export interface SellerProfile {
  id: string
  user: UserPublic
  headline: string | null
  bio: string | null
  category_id: string | null
  career_years: number | null
  review_count: number
  average_rating: number | null
  created_at: string
}

export interface SellerProfileInput {
  headline?: string | null
  bio?: string | null
  category_id?: string | null
  career_years?: number | null
}

export type MediaType = 'image' | 'video'
export type PortfolioStatus = 'draft' | 'published'

export interface PortfolioMedia {
  id: string
  media_type: MediaType
  file_path: string
  sort_order: number
}

export interface PortfolioMediaInput {
  media_type: MediaType
  file_path: string
  sort_order: number
}

export interface PortfolioPost {
  id: string
  seller_profile_id: string
  title: string
  content: string
  status: PortfolioStatus
  media: PortfolioMedia[]
  created_at: string
  updated_at: string
}

export interface PortfolioPostSummary {
  id: string
  title: string
  status: PortfolioStatus
  thumbnail: string | null
  created_at: string
}

export interface PortfolioPostInput {
  title: string
  content: string
  status: PortfolioStatus
  media: PortfolioMediaInput[]
}
