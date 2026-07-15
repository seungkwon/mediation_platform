import { apiClient } from './client'
import type { ChatMessage, ChatRoom } from '@/types/chat'

export async function fetchChatRooms(): Promise<ChatRoom[]> {
  const { data } = await apiClient.get<ChatRoom[]>('/chat/rooms')
  return data
}

export async function fetchChatMessages(roomId: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`)
  return data
}
