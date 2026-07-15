import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteFaqPost } from '@/api/faq'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import { useFaqPost } from '@/hooks/useFaq'
import { useAuthStore } from '@/store/authStore'

export default function FaqDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const faqQuery = useFaqPost(id)

  const deleteMutation = useMutation({
    mutationFn: () => deleteFaqPost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] })
      navigate('/faq', { replace: true })
    },
  })

  if (!id) return null
  if (faqQuery.isLoading) {
    return <PagePlaceholder title="FAQ" description="불러오는 중..." />
  }
  if (faqQuery.isError || !faqQuery.data) {
    return <PagePlaceholder title="FAQ" description="게시물을 찾을 수 없습니다." />
  }

  const post = faqQuery.data

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-sm font-medium text-primary-600 dark:text-primary-400"
      >
        ← 뒤로
      </button>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Q. {post.title}</h1>
          {post.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
        </div>
        {user?.is_admin && (
          <div className="flex items-center gap-3 text-sm">
            <Link to={`/faq/${post.id}/edit`} className="font-medium text-primary-600 dark:text-primary-400">
              수정
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('이 FAQ를 삭제하시겠습니까?')) deleteMutation.mutate()
              }}
              className="font-medium text-red-500"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <RichTextEditor value={post.content} readOnly />
    </div>
  )
}
