import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteResourcePost } from '@/api/resources'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import { useResourcePost } from '@/hooks/useResources'
import { formatFileSize } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/store/authStore'

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const resourceQuery = useResourcePost(id)

  const deleteMutation = useMutation({
    mutationFn: () => deleteResourcePost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      navigate('/resources', { replace: true })
    },
  })

  if (!id) return null
  if (resourceQuery.isLoading) {
    return <PagePlaceholder title="자료실" description="불러오는 중..." />
  }
  if (resourceQuery.isError || !resourceQuery.data) {
    return <PagePlaceholder title="자료실" description="게시물을 찾을 수 없습니다." />
  }

  const post = resourceQuery.data

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
          {post.status === 'draft' && <span className="text-xs text-neutral-400">초안</span>}
        </div>
        {user?.is_admin && (
          <div className="flex items-center gap-3 text-sm">
            <Link to={`/resources/${post.id}/edit`} className="font-medium text-primary-600 dark:text-primary-400">
              수정
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('이 자료를 삭제하시겠습니까?')) deleteMutation.mutate()
              }}
              className="font-medium text-red-500"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <RichTextEditor value={post.content} readOnly />

      {post.attachments.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-50">첨부파일</h2>
          <ul className="flex flex-col gap-1">
            {post.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={mediaUrl(attachment.file_path)}
                  download={attachment.original_filename}
                  className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  {attachment.original_filename}
                </a>
                <span className="ml-2 text-xs text-neutral-400">({formatFileSize(attachment.size)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
