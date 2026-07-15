import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { updateQnaPost } from '@/api/qna'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { QnaForm } from '@/components/qna/QnaForm'
import { useQnaPost } from '@/hooks/useQna'
import { extractErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'

export default function QnaEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const qnaQuery = useQnaPost(id)

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateQnaPost>[1]) => updateQnaPost(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qna', id] })
      navigate(`/qna/${id}`, { replace: true })
    },
  })

  if (!id) return null
  if (qnaQuery.isLoading) {
    return <PagePlaceholder title="질문 수정" description="불러오는 중..." />
  }
  if (qnaQuery.isError || !qnaQuery.data) {
    return <PagePlaceholder title="질문 수정" description="게시물을 찾을 수 없습니다." />
  }
  if (qnaQuery.data.author.id !== user?.id) {
    return <PagePlaceholder title="질문 수정" description="본인 질문만 수정할 수 있습니다." />
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">질문 수정</h1>
      <QnaForm
        initial={qnaQuery.data}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        isSubmitting={updateMutation.isPending}
        submitLabel="저장"
      />
      {updateMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(updateMutation.error)}</p>}
    </div>
  )
}
