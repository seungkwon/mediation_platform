import { apiClient } from './client'
import type { PortfolioPost, PortfolioPostInput, PortfolioPostSummary } from '@/types/seller'

export async function fetchPortfoliosBySeller(sellerId: string): Promise<PortfolioPostSummary[]> {
  const { data } = await apiClient.get<PortfolioPostSummary[]>('/portfolios', { params: { seller_id: sellerId } })
  return data
}

export async function fetchPortfolio(id: string): Promise<PortfolioPost> {
  const { data } = await apiClient.get<PortfolioPost>(`/portfolios/${id}`)
  return data
}

export async function createPortfolio(payload: PortfolioPostInput): Promise<PortfolioPost> {
  const { data } = await apiClient.post<PortfolioPost>('/portfolios', payload)
  return data
}

export async function updatePortfolio(id: string, payload: Partial<PortfolioPostInput>): Promise<PortfolioPost> {
  const { data } = await apiClient.patch<PortfolioPost>(`/portfolios/${id}`, payload)
  return data
}

export async function deletePortfolio(id: string): Promise<void> {
  await apiClient.delete(`/portfolios/${id}`)
}
