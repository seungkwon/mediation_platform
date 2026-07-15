import { Link } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function NotFound() {
  return (
    <PagePlaceholder title="404" description="페이지를 찾을 수 없습니다.">
      <Link to="/" className="text-primary-600 underline dark:text-primary-400">
        홈으로 돌아가기
      </Link>
    </PagePlaceholder>
  )
}
