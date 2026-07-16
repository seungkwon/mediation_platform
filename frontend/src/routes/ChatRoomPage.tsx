import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useChatRooms } from '@/hooks/useChatRooms'
import { useChatSocket } from '@/hooks/useChatSocket'
import { formatDateTime } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage } from '@/types/chat'

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const user = useAuthStore((state) => state.user)
  const messagesQuery = useChatMessages(roomId)
  const roomsQuery = useChatRooms()
  const room = roomsQuery.data?.find((r) => r.id === roomId)
  const other = room && (room.buyer.id === user?.id ? room.seller : room.buyer)
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { connected, sendMessage } = useChatSocket(roomId, (message) => {
    setLiveMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
  })

  useEffect(() => {
    setLiveMessages([])
  }, [roomId])

  const messages = [...(messagesQuery.data ?? []), ...liveMessages]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!roomId) return null
  if (messagesQuery.isLoading) {
    return <PagePlaceholder title="채팅방" description="불러오는 중..." />
  }

  const handleSend = () => {
    if (!draft.trim()) return
    sendMessage({ message_type: 'text', content: draft.trim() })
    setDraft('')
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          {other?.profile_image_path && (
            <img src={mediaUrl(other.profile_image_path)} alt="" className="size-8 rounded-full object-cover" />
          )}
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{other?.name ?? '채팅'}</h1>
        </div>
        <span className={`text-xs ${connected ? 'text-green-500' : 'text-neutral-400'}`}>
          {connected ? '연결됨' : '연결 중...'}
        </span>
      </div>

      {room && (
        <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          이 채팅방은 <span className="font-medium">{room.service_request_title}</span> 요청에 판매자가 견적을
          제출하면서 자동으로 생성되었습니다. 요청 1건당 견적을 제출한 판매자별로 별도의 채팅방이 만들어집니다.
        </p>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
        {messages.map((message) => {
          const isMine = message.sender_id === user?.id
          return (
            <div key={message.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                }`}
              >
                {message.content}
              </div>
              <span className="mt-1 text-xs text-neutral-400">{formatDateTime(message.created_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSend()
          }}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!connected}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          전송
        </button>
      </div>
    </div>
  )
}
