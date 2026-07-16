import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { grantAdminRole, revokeAdminRole } from '@/api/admin'
import { useAdminUser } from '@/hooks/useAdmin'
import { extractErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import type { AdminRole } from '@/types/admin'

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'moderator', label: '운영자' },
  { value: 'super_admin', label: '최고 관리자' },
]

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>()
  const userQuery = useAdminUser(id)
  const queryClient = useQueryClient()
  const [role, setRole] = useState<AdminRole>('moderator')

  const grantMutation = useMutation({
    mutationFn: () => grantAdminRole(id!, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
  const revokeMutation = useMutation({
    mutationFn: () => revokeAdminRole(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (!id) return null
  if (userQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-6 py-12">
        <p className="text-sm text-red-500">회원 정보를 불러올 수 없습니다 (관리자 권한이 필요합니다).</p>
      </div>
    )
  }

  const user = userQuery.data
  if (!user) return null

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center gap-3">
        {user.profile_image_path ? (
          <img src={mediaUrl(user.profile_image_path)} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <div className="size-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        )}
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{user.name}</h1>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <div className="flex justify-between">
          <span className="text-neutral-400">이메일</span>
          <span className="text-neutral-900 dark:text-neutral-50">{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">전화번호</span>
          <span className="text-neutral-900 dark:text-neutral-50">{user.phone ?? '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">이용 모드</span>
          <span className="text-neutral-900 dark:text-neutral-50">{user.active_role === 'seller' ? '판매자' : '구매자'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">계정 상태</span>
          <span className={user.is_active ? 'text-neutral-900 dark:text-neutral-50' : 'text-red-500'}>
            {user.is_active ? '활성' : '비활성화됨'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">가입일</span>
          <span className="text-neutral-900 dark:text-neutral-50">{formatDateTime(user.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">마지막 로그인</span>
          <span className="text-neutral-900 dark:text-neutral-50">
            {user.last_login_at ? formatDateTime(user.last_login_at) : '없음'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">관리자 권한</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          현재: {user.admin_role === 'super_admin' ? '최고 관리자' : user.admin_role === 'moderator' ? '운영자' : '일반 회원'}
        </p>

        <div className="flex gap-2">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => grantMutation.mutate()}
            disabled={grantMutation.isPending}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {grantMutation.isPending ? '적용 중...' : '권한 부여'}
          </button>
        </div>

        {user.admin_role && (
          <button
            type="button"
            onClick={() => revokeMutation.mutate()}
            disabled={revokeMutation.isPending}
            className="self-start text-sm font-medium text-red-500 disabled:opacity-60"
          >
            {revokeMutation.isPending ? '해제 중...' : '관리자 권한 해제'}
          </button>
        )}

        {grantMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(grantMutation.error)}</p>}
        {revokeMutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(revokeMutation.error)}</p>}
      </div>
    </div>
  )
}
