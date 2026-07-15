import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { createFaqPost } from '@/api/faq'
import { FaqForm } from '@/components/faq/FaqForm'
import { extractErrorMessage } from '@/lib/errors'

export default function FaqNew() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: createFaqPost,
    onSuccess: (post) => navigate(`/faq/${post.id}`, { replace: true }),
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">FAQ 작성</h1>
      <FaqForm onSubmit={(payload) => mutation.mutate(payload)} isSubmitting={mutation.isPending} submitLabel="저장" />
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
    </div>
  )
}
