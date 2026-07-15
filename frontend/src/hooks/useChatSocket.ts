import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatMessageCreateInput } from '@/types/chat'

const wsBaseURL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8001/api/v1'

export function useChatSocket(roomId: string | undefined, onMessage: (message: ChatMessage) => void) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const socketRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!roomId || !accessToken) return

    const socket = new WebSocket(`${wsBaseURL}/ws/chat/${roomId}?token=${accessToken}`)
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatMessage
        onMessageRef.current(data)
      } catch {
        // 서버가 { error } 형태의 잘못된 페이로드 응답을 보낸 경우 등은 무시
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
      setConnected(false)
    }
  }, [roomId, accessToken])

  const sendMessage = useCallback((payload: ChatMessageCreateInput) => {
    socketRef.current?.send(JSON.stringify(payload))
  }, [])

  return { connected, sendMessage }
}
