import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/common/StatusBadge'
import { useMyQuotes } from '@/hooks/useQuotes'
import { formatCurrency, formatDateTime } from '@/lib/format'

export default function MyQuotes() {
  const quotesQuery = useMyQuotes()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">내가 제출한 견적</h1>

      {quotesQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">제출한 견적이 없습니다.</p>
      )}

      <div className="flex flex-col gap-3">
        {quotesQuery.data?.map((quote) => (
          <div
            key={quote.id}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <StatusBadge status={quote.status} />
              <span className="text-xs text-neutral-400">
                제출됨 {formatDateTime(quote.created_at)} / 마감 {formatDateTime(quote.service_request_bid_deadline)}
              </span>
            </div>
            <p className="font-medium text-neutral-900 dark:text-neutral-50">{quote.service_request_title}</p>
            {quote.price != null && (
              <p className="text-sm text-neutral-700 dark:text-neutral-200">
                {formatCurrency(quote.price)} · {quote.delivery_days}일
              </p>
            )}
            <Link
              to={`/requests/${quote.service_request_id}`}
              className="self-start text-sm font-medium text-primary-600 dark:text-primary-400"
            >
              요청 보기
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
