import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAdminUsers } from '@/hooks/useAdmin'
import { formatDateTime } from '@/lib/format'
import { mediaUrl } from '@/lib/media'

const ADMIN_ROLE_LABEL: Record<string, string> = {
  super_admin: '최고 관리자',
  moderator: '운영자',
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const usersQuery = useAdminUsers(search || undefined)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">회원 관리</h1>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="이름 또는 이메일로 검색"
        className="w-full max-w-sm rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {usersQuery.isError && <p className="text-sm text-red-500">관리자 권한이 필요합니다.</p>}
      {usersQuery.data?.length === 0 && <p className="text-neutral-500 dark:text-neutral-400">회원이 없습니다.</p>}

      <div className="flex flex-col gap-2">
        {usersQuery.data?.map((user) => (
          <Link
            key={user.id}
            to={`/admin/users/${user.id}`}
            className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {user.profile_image_path ? (
                  <img src={mediaUrl(user.profile_image_path)} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800" />
                )}
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {user.name} <span className="text-sm font-normal text-neutral-400">{user.email}</span>
                </span>
              </div>
              {user.admin_role && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                  {ADMIN_ROLE_LABEL[user.admin_role] ?? user.admin_role}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
              <span>{user.active_role === 'seller' ? '판매자 모드' : '구매자 모드'}</span>
              {!user.is_active && <span className="text-red-500">비활성화됨</span>}
              <span>가입 {formatDateTime(user.created_at)}</span>
              <span>마지막 로그인 {user.last_login_at ? formatDateTime(user.last_login_at) : '없음'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
