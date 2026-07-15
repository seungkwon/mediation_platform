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

export type PortfolioStatus = 'draft' | 'published'

export interface PortfolioPost {
  id: string
  seller_profile_id: string
  title: string
  content: string
  status: PortfolioStatus
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
}
