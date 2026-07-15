import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { createNotice } from '@/api/notices'
import { NoticeForm } from '@/components/notice/NoticeForm'
import { extractErrorMessage } from '@/lib/errors'

export default function NoticeNew() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: createNotice,
    onSuccess: (notice) => navigate(`/notices/${notice.id}`, { replace: true }),
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">공지사항 작성</h1>
      <NoticeForm onSubmit={(payload) => mutation.mutate(payload)} isSubmitting={mutation.isPending} submitLabel="저장" />
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
    </div>
  )
}
