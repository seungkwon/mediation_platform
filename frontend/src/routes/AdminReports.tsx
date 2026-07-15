import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { updateReport } from '@/api/admin'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useReports } from '@/hooks/useAdmin'
import { extractErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { Report, ReportStatus } from '@/types/admin'

const STATUS_OPTIONS: ReportStatus[] = ['pending', 'reviewing', 'resolved', 'rejected']

function ReportRow({ report }: { report: Report }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState(report.admin_note ?? '')

  const mutation = useMutation({
    mutationFn: (status: ReportStatus) => updateReport(report.id, { status, admin_note: note || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {report.target_type} · {report.target_id}
        </span>
        <StatusBadge status={report.status} />
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{report.reason}</p>
      <span className="text-xs text-neutral-400">{formatDateTime(report.created_at)}</span>
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

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('')
  const reportsQuery = useReports(statusFilter || undefined)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">신고 관리</h1>
      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as ReportStatus | '')}
        className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <option value="">전체 상태</option>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {reportsQuery.isError && <p className="text-sm text-red-500">관리자 권한이 필요합니다.</p>}
      {reportsQuery.data?.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">신고 내역이 없습니다.</p>
      )}
      <div className="flex flex-col gap-3">
        {reportsQuery.data?.map((report) => (
          <ReportRow key={report.id} report={report} />
        ))}
      </div>
    </div>
  )
}
