import { Link } from 'react-router-dom'

import { useFaqPosts } from '@/hooks/useFaq'
import { useAuthStore } from '@/store/authStore'

export default function FaqList() {
  const user = useAuthStore((state) => state.user)
  const faqQuery = useFaqPosts()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">자주 묻는 질문</h1>
        {user?.is_admin && (
          <Link
            to="/faq/new"
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            새 글 작성
          </Link>
        )}
      </div>

      {faqQuery.isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
      {faqQuery.data?.length === 0 && <p className="text-neutral-500 dark:text-neutral-400">등록된 FAQ가 없습니다.</p>}

      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {faqQuery.data?.map((post) => (
          <Link
            key={post.id}
            to={`/faq/${post.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <span className="font-medium text-neutral-900 dark:text-neutral-50">Q. {post.title}</span>
            {post.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
