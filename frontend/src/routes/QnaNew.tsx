import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { createQnaPost } from '@/api/qna'
import { QnaForm } from '@/components/qna/QnaForm'
import { extractErrorMessage } from '@/lib/errors'

export default function QnaNew() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: createQnaPost,
    onSuccess: (post) => navigate(`/qna/${post.id}`, { replace: true }),
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">질문하기</h1>
      <QnaForm onSubmit={(payload) => mutation.mutate(payload)} isSubmitting={mutation.isPending} submitLabel="등록" />
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
    </div>
  )
}
