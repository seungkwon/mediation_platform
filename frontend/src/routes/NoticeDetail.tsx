import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteNotice } from '@/api/notices'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import { useNotice } from '@/hooks/useNotices'
import { useAuthStore } from '@/store/authStore'

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const noticeQuery = useNotice(id)

  const deleteMutation = useMutation({
    mutationFn: () => deleteNotice(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      navigate('/notices', { replace: true })
    },
  })

  if (!id) return null
  if (noticeQuery.isLoading) {
    return <PagePlaceholder title="공지사항" description="불러오는 중..." />
  }
  if (noticeQuery.isError || !noticeQuery.data) {
    return <PagePlaceholder title="공지사항" description="게시물을 찾을 수 없습니다." />
  }

  const notice = noticeQuery.data

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
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{notice.title}</h1>
          {notice.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
        </div>
        {user?.is_admin && (
          <div className="flex items-center gap-3 text-sm">
            <Link to={`/notices/${notice.id}/edit`} className="font-medium text-primary-600 dark:text-primary-400">
              수정
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('이 공지사항을 삭제하시겠습니까?')) deleteMutation.mutate()
              }}
              className="font-medium text-red-500"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <RichTextEditor value={notice.content} readOnly />
    </div>
  )
}
