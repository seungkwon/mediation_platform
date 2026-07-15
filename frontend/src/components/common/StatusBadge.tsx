const STATUS_STYLES: Record<string, string> = {
  open: 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
  awarded: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200',
  expired: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  cancelled: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  submitted: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  opened: 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
  selected: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  open: '진행중',
  awarded: '낙찰완료',
  expired: '마감',
  cancelled: '취소됨',
  submitted: '제출됨',
  opened: '열람됨',
  selected: '선택됨',
  rejected: '거절됨',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-500'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
