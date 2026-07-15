import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function ChatRoomPage() {
  const { roomId } = useParams()
  return <PagePlaceholder title="채팅방" description={`채팅방 ID: ${roomId}`} />
}
