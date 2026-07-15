import { useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/common/StatusBadge'
import { useCategories } from '@/hooks/useCategories'
import { useServiceRequests } from '@/hooks/useServiceRequests'
import { formatDateTime } from '@/lib/format'

export default function RequestsList() {
  const [categoryId, setCategoryId] = useState('')
  const { data: categories } = useCategories()
  const requestsQuery = useServiceRequests(categoryId ? { category_id: categoryId } : undefined)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">서비스 요청</h1>
        <Link
          to="/requests/new"
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          요청 작성
        </Link>
      </div>

      <select
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
        className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <option value="">전체 카테고리</option>
        {categories?.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {requestsQuery.isLoading && <p className="text-neutral-500 dark:text-neutral-400">불러오는 중...</p>}
      {requestsQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">등록된 요청이 없습니다.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {requestsQuery.data?.map((request) => (
          <Link
            key={request.id}
            to={`/requests/${request.id}`}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <StatusBadge status={request.status} />
              <span className="text-xs text-neutral-400">견적 {request.quote_count}건</span>
            </div>
            <p className="font-medium text-neutral-900 dark:text-neutral-50">{request.title}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {request.budget_min != null || request.budget_max != null
                ? `${request.budget_min?.toLocaleString() ?? '?'} ~ ${request.budget_max?.toLocaleString() ?? '?'}원`
                : '예산 미정'}
            </p>
            <p className="text-xs text-neutral-400">마감 {formatDateTime(request.bid_deadline)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
