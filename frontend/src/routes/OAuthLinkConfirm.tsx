import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { oauthLinkConfirm } from '@/api/auth'
import { TextField } from '@/components/common/TextField'
import { extractErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import type { SocialProvider } from '@/types/auth'

interface LocationState {
  provider: SocialProvider
  linkToken: string
  maskedEmail: string
}

export default function OAuthLinkConfirm() {
  const location = useLocation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const state = location.state as LocationState | null

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!state) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          연결 요청 정보를 찾을 수 없습니다. 로그인을 다시 시도해주세요.
        </p>
        <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400">
          로그인으로 이동
        </Link>
      </div>
    )
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const tokens = await oauthLinkConfirm(state.provider, state.linkToken, password)
      setAuth({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token, user: tokens.user })
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">계정 연결</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          <strong>{state.maskedEmail}</strong> 계정이 이미 있습니다. 비밀번호를 확인하면 소셜 로그인을 연결합니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="비밀번호"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {submitting ? '연결 중...' : '연결하기'}
        </button>
      </form>
    </div>
  )
}
