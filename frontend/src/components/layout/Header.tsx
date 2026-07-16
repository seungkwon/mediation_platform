import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { useUpdateMe } from '@/hooks/useUpdateMe'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

const loggedOutNavItems = [
  { to: '/sellers', label: '판매자 찾기' },
  { to: '/chat', label: '채팅' },
  { to: '/my/requests', label: '내 요청' },
  { to: '/my/quotes', label: '내 견적' },
  { to: '/my/reviews', label: '내 리뷰' },
  { to: '/my/profile', label: '내 정보' },
]

const commonNavItems = [{ to: '/chat', label: '채팅' }]

const buyerOnlyNavItems = [
  { to: '/sellers', label: '판매자 찾기' },
  { to: '/my/requests', label: '내 요청' },
]

const adminOnlyNavItems = [
  { to: '/requests', label: '서비스 요청' },
  { to: '/admin', label: '관리자 홈' },
  { to: '/admin/users', label: '회원 관리' },
  { to: '/admin/reports', label: '신고 관리' },
  { to: '/admin/disputes', label: '분쟁 관리' },
]

const sellerOnlyNavItems = [
  { to: '/requests', label: '요청 둘러보기' },
  { to: '/my/quotes', label: '내 견적' },
]

const alwaysNavItems = [
  { to: '/my/reviews', label: '내 리뷰' },
  { to: '/my/profile', label: '내 정보' },
]

const boardNavItems = [
  { to: '/notices', label: '공지사항' },
  { to: '/qna', label: '질문답변' },
  { to: '/faq', label: 'FAQ' },
  { to: '/resources', label: '자료실' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
  }`

const ROLE_TOGGLE_LABEL: Record<UserRole, string> = {
  buyer: '구매자 모드',
  seller: '판매자 모드',
  admin: '관리자 모드',
}

function RoleToggle({
  role,
  onChange,
  disabled,
  showAdmin,
}: {
  role: UserRole
  onChange: (role: UserRole) => void
  disabled: boolean
  showAdmin: boolean
}) {
  const roles: UserRole[] = showAdmin ? ['buyer', 'seller', 'admin'] : ['buyer', 'seller']
  return (
    <div className="inline-flex rounded-md border border-neutral-200 p-0.5 text-xs font-medium dark:border-neutral-700">
      {roles.map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onChange(r)}
          className={`rounded px-2 py-1 transition-colors disabled:opacity-60 ${
            role === r
              ? 'bg-primary-500 text-white'
              : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          {ROLE_TOGGLE_LABEL[r]}
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const updateMe = useUpdateMe()

  const rawNavItems = user
    ? user.active_role === 'admin'
      ? [...adminOnlyNavItems, ...alwaysNavItems, ...boardNavItems]
      : [
          ...commonNavItems,
          ...(user.active_role === 'seller' ? sellerOnlyNavItems : buyerOnlyNavItems),
          ...alwaysNavItems,
          ...boardNavItems,
          ...(user.active_role === 'seller' && user.has_seller_profile
            ? [{ to: `/sellers/${user.id}`, label: '판매자 프로필' }]
            : []),
        ]
    : loggedOutNavItems

  // 같은 경로가 여러 그룹(예: 판매자 모드 + 관리자)에 동시에 걸리면 마지막 라벨만 남긴다.
  const navItems = Array.from(new Map(rawNavItems.map((item) => [item.to, item])).values())

  const changeRole = (role: UserRole) => {
    if (!user || user.active_role === role) return
    updateMe.mutate({ active_role: role })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link to="/" className="text-lg font-bold text-primary-600 dark:text-primary-400">
            중계 플랫폼
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <RoleToggle role={user.active_role} onChange={changeRole} disabled={updateMe.isPending} showAdmin={user.is_admin} />
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{user.name}님</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="rounded-md bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-neutral-600 md:hidden dark:text-neutral-300"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="hidden flex-wrap items-center gap-1 border-t border-neutral-200 py-2 md:flex dark:border-neutral-800">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-neutral-200 px-4 py-3 md:hidden dark:border-neutral-800">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            {user ? (
              <>
                <RoleToggle role={user.active_role} onChange={changeRole} disabled={updateMe.isPending} showAdmin={user.is_admin} />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">{user.name}님</span>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setMenuOpen(false)
                    }}
                    className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300" onClick={() => setMenuOpen(false)}>
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="rounded-md bg-primary-500 px-3 py-2 text-sm font-medium text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
