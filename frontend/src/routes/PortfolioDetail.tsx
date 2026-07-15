import { useNavigate, useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import { usePortfolio } from '@/hooks/usePortfolios'

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const portfolioQuery = usePortfolio(id)

  if (!id) return null
  if (portfolioQuery.isLoading) {
    return <PagePlaceholder title="포트폴리오" description="불러오는 중..." />
  }
  if (portfolioQuery.isError || !portfolioQuery.data) {
    return <PagePlaceholder title="포트폴리오" description="게시물을 찾을 수 없습니다." />
  }

  const post = portfolioQuery.data

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-sm font-medium text-primary-600 dark:text-primary-400"
      >
        ← 뒤로
      </button>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{post.title}</h1>
        {post.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
      </div>
      <RichTextEditor value={post.content} readOnly />
    </div>
  )
}
