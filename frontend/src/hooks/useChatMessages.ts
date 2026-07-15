import { useQuery } from '@tanstack/react-query'

import { fetchChatMessages } from '@/api/chat'

export function useChatMessages(roomId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => fetchChatMessages(roomId!),
    enabled: !!roomId,
  })
}
