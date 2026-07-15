import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { updateFaqPost } from '@/api/faq'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { FaqForm } from '@/components/faq/FaqForm'
import { useFaqPost } from '@/hooks/useFaq'
import { extractErrorMessage } from '@/lib/errors'

export default function FaqEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const faqQuery = useFaqPost(id)

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateFaqPost>[1]) => updateFaqPost(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq', id] })
      navigate(`/faq/${id}`, { replace: true })
    },
  })

  if (!id) return null
  if (faqQuery.isLoading) {
    return <PagePlaceholder title="FAQ 수정" description="불러오는 중..." />
  }
  if (faqQuery.isError || !faqQuery.data) {
    return <PagePlaceholder title="FAQ 수정" description="게시물을 찾을 수 없습니다." />
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">FAQ 수정</h1>
      <FaqForm
        initial={faqQuery.data}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        isSubmitting={updateMutation.isPending}
        submitLabel="저장"
      />
      {updateMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(updateMutation.error)}</p>}
    </div>
  )
}
