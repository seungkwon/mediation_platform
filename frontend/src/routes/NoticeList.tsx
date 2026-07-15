import { Link } from 'react-router-dom'

import { useNotices } from '@/hooks/useNotices'
import { useAuthStore } from '@/store/authStore'

export default function NoticeList() {
  const user = useAuthStore((state) => state.user)
  const noticesQuery = useNotices()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">공지사항</h1>
        {user?.is_admin && (
          <Link
            to="/notices/new"
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            새 글 작성
          </Link>
        )}
      </div>

      {noticesQuery.isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
      {noticesQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">등록된 공지사항이 없습니다.</p>
      )}

      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {noticesQuery.data?.map((notice) => (
          <Link
            key={notice.id}
            to={`/notices/${notice.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <span className="font-medium text-neutral-900 dark:text-neutral-50">{notice.title}</span>
            {notice.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
