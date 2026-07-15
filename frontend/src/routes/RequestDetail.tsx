import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function RequestDetail() {
  const { id } = useParams()
  return <PagePlaceholder title="서비스 요청 상세" description={`요청 ID: ${id}`} />
}
