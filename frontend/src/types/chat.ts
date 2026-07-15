import type { UserPublic } from './user'

export type ChatMessageType = 'text' | 'image' | 'file'

export interface ChatRoom {
  id: string
  service_request_id: string
  service_request_title: string
  buyer: UserPublic
  seller: UserPublic
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  chat_room_id: string
  sender_id: string
  message_type: ChatMessageType
  content: string | null
  file_path: string | null
  read_at: string | null
  created_at: string
}

export interface ChatMessageCreateInput {
  message_type?: ChatMessageType
  content?: string | null
  file_path?: string | null
}
