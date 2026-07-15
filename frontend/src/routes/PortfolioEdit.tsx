import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { deletePortfolio, updatePortfolio } from '@/api/portfolios'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { PortfolioForm } from '@/components/portfolio/PortfolioForm'
import { usePortfolio } from '@/hooks/usePortfolios'
import { extractErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'

export default function PortfolioEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const portfolioQuery = usePortfolio(id)

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updatePortfolio>[1]) => updatePortfolio(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] })
      navigate(`/sellers/${user?.id}`, { replace: true })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePortfolio(id!),
    onSuccess: () => navigate(`/sellers/${user?.id}`, { replace: true }),
  })

  if (!id) return null
  if (portfolioQuery.isLoading) {
    return <PagePlaceholder title="포트폴리오 수정" description="불러오는 중..." />
  }
  if (portfolioQuery.isError || !portfolioQuery.data) {
    return <PagePlaceholder title="포트폴리오 수정" description="게시물을 찾을 수 없습니다." />
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">포트폴리오 수정</h1>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('이 게시물을 삭제하시겠습니까?')) deleteMutation.mutate()
          }}
          className="text-sm font-medium text-red-500"
        >
          삭제
        </button>
      </div>
      <PortfolioForm
        initial={portfolioQuery.data}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        isSubmitting={updateMutation.isPending}
        submitLabel="저장"
      />
      {updateMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(updateMutation.error)}</p>}
      {deleteMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(deleteMutation.error)}</p>}
    </div>
  )
}
