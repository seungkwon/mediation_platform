import { Link } from 'react-router-dom'

import { useChatRooms } from '@/hooks/useChatRooms'
import { formatDateTime } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/store/authStore'

export default function ChatList() {
  const user = useAuthStore((state) => state.user)
  const roomsQuery = useChatRooms()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">채팅</h1>

      {roomsQuery.data?.length === 0 && <p className="text-neutral-500 dark:text-neutral-400">채팅방이 없습니다.</p>}

      <div className="flex flex-col gap-2">
        {roomsQuery.data?.map((room) => {
          const other = room.buyer.id === user?.id ? room.seller : room.buyer
          return (
            <Link
              key={room.id}
              to={`/chat/${room.id}`}
              className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {other.profile_image_path && (
                    <img
                      src={mediaUrl(other.profile_image_path)}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{other.name}</span>
                </div>
                {room.last_message_at && (
                  <span className="text-xs text-neutral-400">{formatDateTime(room.last_message_at)}</span>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{room.service_request_title}</p>
              {room.last_message && (
                <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">{room.last_message}</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
