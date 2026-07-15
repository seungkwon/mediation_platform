import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { createPortfolio } from '@/api/portfolios'
import { PortfolioForm } from '@/components/portfolio/PortfolioForm'
import { extractErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'

export default function PortfolioNew() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const mutation = useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => navigate(`/sellers/${user?.id}`, { replace: true }),
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">포트폴리오 작성</h1>
      <PortfolioForm
        onSubmit={(payload) => mutation.mutate(payload)}
        isSubmitting={mutation.isPending}
        submitLabel="저장"
      />
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
    </div>
  )
}
