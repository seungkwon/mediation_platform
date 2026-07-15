import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { updateResourcePost } from '@/api/resources'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { ResourceForm } from '@/components/resource/ResourceForm'
import { useResourcePost } from '@/hooks/useResources'
import { extractErrorMessage } from '@/lib/errors'

export default function ResourceEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const resourceQuery = useResourcePost(id)

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateResourcePost>[1]) => updateResourcePost(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource', id] })
      navigate(`/resources/${id}`, { replace: true })
    },
  })

  if (!id) return null
  if (resourceQuery.isLoading) {
    return <PagePlaceholder title="자료 수정" description="불러오는 중..." />
  }
  if (resourceQuery.isError || !resourceQuery.data) {
    return <PagePlaceholder title="자료 수정" description="게시물을 찾을 수 없습니다." />
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">자료 수정</h1>
      <ResourceForm
        initial={resourceQuery.data}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        isSubmitting={updateMutation.isPending}
        submitLabel="저장"
      />
      {updateMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(updateMutation.error)}</p>}
    </div>
  )
}
