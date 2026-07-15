import { Link } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export default function AdminHome() {
  return (
    <PagePlaceholder title="관리자" description="신고/분쟁 처리 대시보드는 다음 마일스톤에서 구현됩니다.">
      <div className="flex gap-3">
        <Link to="/admin/reports" className="text-primary-600 underline dark:text-primary-400">
          신고 관리
        </Link>
        <Link to="/admin/disputes" className="text-primary-600 underline dark:text-primary-400">
          분쟁 관리
        </Link>
      </div>
    </PagePlaceholder>
  )
}
