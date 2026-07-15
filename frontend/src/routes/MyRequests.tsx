import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { cancelServiceRequest } from '@/api/serviceRequests'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useMyServiceRequests } from '@/hooks/useServiceRequests'
import { formatDateTime } from '@/lib/format'

export default function MyRequests() {
  const requestsQuery = useMyServiceRequests()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelServiceRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-requests', 'mine'] }),
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">내가 등록한 요청</h1>
        <Link
          to="/requests/new"
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          새 요청 작성
        </Link>
      </div>

      {requestsQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">등록한 요청이 없습니다.</p>
      )}

      <div className="flex flex-col gap-3">
        {requestsQuery.data?.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <StatusBadge status={request.status} />
              <span className="text-xs text-neutral-400">견적 {request.quote_count}건</span>
            </div>
            <Link
              to={`/requests/${request.id}`}
              className="font-medium text-neutral-900 hover:underline dark:text-neutral-50"
            >
              {request.title}
            </Link>
            <p className="text-xs text-neutral-400">마감 {formatDateTime(request.bid_deadline)}</p>
            {request.status === 'open' && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('이 요청을 취소하시겠습니까?')) cancelMutation.mutate(request.id)
                }}
                className="self-start text-sm font-medium text-red-500"
              >
                취소
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
