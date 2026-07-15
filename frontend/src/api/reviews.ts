import { apiClient } from './client'
import type { Review, ReviewCreateInput } from '@/types/review'

export async function fetchUserReviews(userId: string): Promise<Review[]> {
  const { data } = await apiClient.get<Review[]>(`/users/${userId}/reviews`)
  return data
}

export async function createReview(payload: ReviewCreateInput): Promise<Review> {
  const { data } = await apiClient.post<Review>('/reviews', payload)
  return data
}
