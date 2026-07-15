import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { updateDispute } from '@/api/admin'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useDisputes } from '@/hooks/useAdmin'
import { extractErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { Dispute, DisputeStatus } from '@/types/admin'

const STATUS_OPTIONS: DisputeStatus[] = ['open', 'in_review', 'resolved']

function DisputeRow({ dispute }: { dispute: Dispute }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState(dispute.admin_note ?? '')

  const mutation = useMutation({
    mutationFn: (status: DisputeStatus) => updateDispute(dispute.id, { status, admin_note: note || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
  })

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          요청 {dispute.service_request_id}
        </span>
        <StatusBadge status={dispute.status} />
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{dispute.description}</p>
      <span className="text-xs text-neutral-400">{formatDateTime(dispute.created_at)}</span>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="처리 메모"
        rows={2}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => mutation.mutate(status)}
            disabled={mutation.isPending}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {status}로 변경
          </button>
        ))}
      </div>
      {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}
    </div>
  )
}

export default function AdminDisputes() {
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | ''>('')
  const disputesQuery = useDisputes(statusFilter || undefined)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">분쟁 관리</h1>
      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as DisputeStatus | '')}
        className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <option value="">전체 상태</option>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {disputesQuery.isError && <p className="text-sm text-red-500">관리자 권한이 필요합니다.</p>}
      {disputesQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">분쟁 내역이 없습니다.</p>
      )}
      <div className="flex flex-col gap-3">
        {disputesQuery.data?.map((dispute) => (
          <DisputeRow key={dispute.id} dispute={dispute} />
        ))}
      </div>
    </div>
  )
}
