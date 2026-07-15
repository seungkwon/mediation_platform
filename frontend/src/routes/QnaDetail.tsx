import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { answerQnaPost, deleteQnaPost } from '@/api/qna'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import { useQnaPost } from '@/hooks/useQna'
import { extractErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'

export default function QnaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const qnaQuery = useQnaPost(id)
  const [answerDraft, setAnswerDraft] = useState('')

  const deleteMutation = useMutation({
    mutationFn: () => deleteQnaPost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qna'] })
      navigate('/qna', { replace: true })
    },
  })

  const answerMutation = useMutation({
    mutationFn: () => answerQnaPost(id!, answerDraft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qna', id] }),
  })

  if (!id) return null
  if (qnaQuery.isLoading) {
    return <PagePlaceholder title="질문답변" description="불러오는 중..." />
  }
  if (qnaQuery.isError || !qnaQuery.data) {
    return <PagePlaceholder title="질문답변" description="게시물을 찾을 수 없습니다." />
  }

  const post = qnaQuery.data
  const isAuthor = user?.id === post.author.id

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
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{post.title}</h1>
          <StatusBadge status={post.status} />
        </div>
        {isAuthor && (
          <div className="flex items-center gap-3 text-sm">
            <Link to={`/qna/${post.id}/edit`} className="font-medium text-primary-600 dark:text-primary-400">
              수정
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('이 질문을 삭제하시겠습니까?')) deleteMutation.mutate()
              }}
              className="font-medium text-red-500"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">작성자: {post.author.name}</p>
      <RichTextEditor value={post.content} readOnly />

      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-50">답변</h2>
        {post.answer ? (
          <RichTextEditor value={post.answer} readOnly />
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">아직 답변이 등록되지 않았습니다.</p>
        )}

        {user?.is_admin && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <RichTextEditor label="답변 작성" value={answerDraft} onChange={setAnswerDraft} uploadCategory="qna" />
            <button
              type="button"
              disabled={answerMutation.isPending || !answerDraft.trim()}
              onClick={() => answerMutation.mutate()}
              className="self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
            >
              {answerMutation.isPending ? '등록 중...' : post.answer ? '답변 수정' : '답변 등록'}
            </button>
            {answerMutation.isError && (
              <p className="text-sm text-red-500">{extractErrorMessage(answerMutation.error)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
