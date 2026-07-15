import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function OAuthCallback() {
  const { provider } = useParams()
  return (
    <PagePlaceholder title="소셜 로그인 처리 중" description={`${provider} 콜백 처리는 다음 마일스톤에서 구현됩니다.`} />
  )
}
