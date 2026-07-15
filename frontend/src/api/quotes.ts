import { apiClient } from './client'
import type { Quote, QuoteCreateInput } from '@/types/quote'

export async function fetchQuotesForRequest(requestId: string): Promise<Quote[]> {
  const { data } = await apiClient.get<Quote[]>(`/service-requests/${requestId}/quotes`)
  return data
}

export async function submitQuote(requestId: string, payload: QuoteCreateInput): Promise<Quote> {
  const { data } = await apiClient.post<Quote>(`/service-requests/${requestId}/quotes`, payload)
  return data
}

export async function fetchMyQuotes(): Promise<Quote[]> {
  const { data } = await apiClient.get<Quote[]>('/quotes/mine')
  return data
}

export async function openQuote(quoteId: string): Promise<Quote> {
  const { data } = await apiClient.post<Quote>(`/quotes/${quoteId}/open`)
  return data
}

export async function selectQuote(quoteId: string): Promise<Quote> {
  const { data } = await apiClient.post<Quote>(`/quotes/${quoteId}/select`)
  return data
}
