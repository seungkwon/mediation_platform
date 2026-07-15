import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function SellerProfilePage() {
  const { id } = useParams()
  return <PagePlaceholder title="판매자 프로필" description={`판매자 ID: ${id}`} />
}
