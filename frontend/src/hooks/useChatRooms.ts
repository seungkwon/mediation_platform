import { useQuery } from '@tanstack/react-query'

import { fetchChatRooms } from '@/api/chat'

export function useChatRooms() {
  return useQuery({ queryKey: ['chat-rooms'], queryFn: fetchChatRooms })
}
