import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { oauthCompleteSignup } from '@/api/auth'
import { TextField } from '@/components/common/TextField'
import { extractErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import type { SocialProvider } from '@/types/auth'

interface LocationState {
  provider: SocialProvider
  signupToken: string
}

export default function OAuthCompleteSignup() {
  const location = useLocation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const state = location.state as LocationState | null

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!state) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          가입 요청 정보를 찾을 수 없습니다. 로그인을 다시 시도해주세요.
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
      const tokens = await oauthCompleteSignup(state.provider, state.signupToken, {
        email,
        name,
        phone: phone || undefined,
      })
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
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">가입 완료</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          로그인에 사용할 이메일 정보가 없어요. 계정 생성을 위해 입력해주세요.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="이메일"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="이름"
          id="name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="전화번호 (선택)"
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          가입 후 구매자/판매자 모드를 선택해 이용할 수 있으며, 언제든 "내 정보"에서 변경할 수 있습니다.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || email.length === 0 || name.length === 0}
          className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {submitting ? '가입 중...' : '가입 완료'}
        </button>
      </form>
    </div>
  )
}
