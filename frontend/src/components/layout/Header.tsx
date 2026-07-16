import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

const baseNavItems = [
  { to: '/sellers', label: '판매자 찾기' },
  { to: '/requests', label: '서비스 요청' },
  { to: '/chat', label: '채팅' },
  { to: '/my/requests', label: '내 요청' },
  { to: '/my/quotes', label: '내 견적' },
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

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navItems = user
    ? [...baseNavItems, ...boardNavItems, { to: `/sellers/${user.id}`, label: '판매자 프로필' }]
    : baseNavItems

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link to="/" className="text-lg font-bold text-primary-600 dark:text-primary-400">
            중계 플랫폼
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
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
          <div className="mt-2 flex items-center gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            {user ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
