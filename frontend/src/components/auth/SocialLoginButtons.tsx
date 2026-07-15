import { buildAuthorizeUrl, clientIdFor, labelFor, SOCIAL_PROVIDERS } from '@/lib/oauth'
import type { SocialProvider } from '@/types/auth'

const BUTTON_STYLES: Record<SocialProvider, string> = {
  naver: 'bg-[#03C75A] text-white hover:bg-[#02b350]',
  kakao: 'bg-[#FEE500] text-neutral-900 hover:bg-[#f5dc00]',
  google: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200',
  apple: 'bg-black text-white hover:bg-neutral-800',
}

function handleClick(provider: SocialProvider) {
  const url = buildAuthorizeUrl(provider)
  if (!url) return
  window.location.href = url
}

export function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        또는
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>
      {SOCIAL_PROVIDERS.map((provider) => {
        const enabled = clientIdFor(provider) !== null
        return (
          <button
            key={provider}
            type="button"
            disabled={!enabled}
            onClick={() => handleClick(provider)}
            title={enabled ? undefined : '관리자가 아직 설정하지 않았습니다.'}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_STYLES[provider]}`}
          >
            {labelFor(provider)}로 계속하기
          </button>
        )
      })}
    </div>
  )
}
