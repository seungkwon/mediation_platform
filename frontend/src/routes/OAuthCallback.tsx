import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { oauthCallback } from '@/api/auth'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'
import { extractErrorMessage } from '@/lib/errors'
import { consumePendingOAuth, SOCIAL_PROVIDERS } from '@/lib/oauth'
import { useAuthStore } from '@/store/authStore'
import type { SocialProvider } from '@/types/auth'

const VALID_PROVIDERS = new Set<string>(SOCIAL_PROVIDERS)

export default function OAuthCallback() {
  const { provider: providerParam } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const provider = providerParam as SocialProvider
    if (!VALID_PROVIDERS.has(provider)) {
      setError('알 수 없는 로그인 방식입니다.')
      return
    }

    const providerError = searchParams.get('error')
    if (providerError) {
      setError('로그인이 취소되었거나 실패했습니다.')
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const pending = consumePendingOAuth(provider, state)
    if (!code || !pending) {
      setError('로그인 요청이 유효하지 않습니다. 다시 시도해주세요.')
      return
    }

    oauthCallback(provider, code, pending.redirectUri)
      .then((result) => {
        if (result.status === 'issued') {
          setAuth({ accessToken: result.access_token, refreshToken: result.refresh_token, user: result.user })
          navigate('/', { replace: true })
        } else if (result.status === 'link_required') {
          navigate('/oauth/link', {
            replace: true,
            state: { provider, linkToken: result.link_token, maskedEmail: result.masked_email },
          })
        } else {
          navigate('/oauth/complete-signup', {
            replace: true,
            state: { provider, signupToken: result.signup_token },
          })
        }
      })
      .catch((err) => setError(extractErrorMessage(err)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return <PagePlaceholder title="로그인 실패" description={error} />
  }
  return <PagePlaceholder title="로그인 처리 중" description="잠시만 기다려주세요..." />
}
