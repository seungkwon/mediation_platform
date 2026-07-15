import { apiClient } from './client'
import type { SellerProfile, SellerProfileInput } from '@/types/seller'

export async function fetchSellerProfile(userId: string): Promise<SellerProfile> {
  const { data } = await apiClient.get<SellerProfile>(`/sellers/${userId}`)
  return data
}

export async function createMySellerProfile(payload: SellerProfileInput): Promise<SellerProfile> {
  const { data } = await apiClient.post<SellerProfile>('/sellers/me', payload)
  return data
}

export async function updateMySellerProfile(payload: SellerProfileInput): Promise<SellerProfile> {
  const { data } = await apiClient.patch<SellerProfile>('/sellers/me', payload)
  return data
}
