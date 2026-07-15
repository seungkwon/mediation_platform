import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { createResourcePost } from '@/api/resources'
import { ResourceForm } from '@/components/resource/ResourceForm'
import { extractErrorMessage } from '@/lib/errors'

export default function ResourceNew() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: createResourcePost,
    onSuccess: (post) => navigate(`/resources/${post.id}`, { replace: true }),
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">자료 등록</h1>
      <ResourceForm onSubmit={(payload) => mutation.mutate(payload)} isSubmitting={mutation.isPending} submitLabel="저장" />
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
    </div>
  )
}
