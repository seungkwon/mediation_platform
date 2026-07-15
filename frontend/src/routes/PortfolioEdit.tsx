import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function PortfolioEdit() {
  const { id } = useParams()
  return <PagePlaceholder title="포트폴리오 수정" description={`포트폴리오 ID: ${id}`} />
}
