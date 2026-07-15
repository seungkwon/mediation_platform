import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/common/StatusBadge'
import { useQnaPosts } from '@/hooks/useQna'

export default function QnaList() {
  const qnaQuery = useQnaPosts()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">질문답변</h1>
        <Link
          to="/qna/new"
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          질문하기
        </Link>
      </div>

      {qnaQuery.isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
      {qnaQuery.data?.length === 0 && <p className="text-neutral-500 dark:text-neutral-400">등록된 질문이 없습니다.</p>}

      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {qnaQuery.data?.map((post) => (
          <Link
            key={post.id}
            to={`/qna/${post.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <span className="font-medium text-neutral-900 dark:text-neutral-50">{post.title}</span>
            <StatusBadge status={post.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
