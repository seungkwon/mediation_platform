import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { updateNotice } from '@/api/notices'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { NoticeForm } from '@/components/notice/NoticeForm'
import { useNotice } from '@/hooks/useNotices'
import { extractErrorMessage } from '@/lib/errors'

export default function NoticeEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const noticeQuery = useNotice(id)

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateNotice>[1]) => updateNotice(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notice', id] })
      navigate(`/notices/${id}`, { replace: true })
    },
  })

  if (!id) return null
  if (noticeQuery.isLoading) {
    return <PagePlaceholder title="공지사항 수정" description="불러오는 중..." />
  }
  if (noticeQuery.isError || !noticeQuery.data) {
    return <PagePlaceholder title="공지사항 수정" description="게시물을 찾을 수 없습니다." />
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">공지사항 수정</h1>
      <NoticeForm
        initial={noticeQuery.data}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        isSubmitting={updateMutation.isPending}
        submitLabel="저장"
      />
      {updateMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(updateMutation.error)}</p>}
    </div>
  )
}
