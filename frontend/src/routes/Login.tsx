import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { TextField } from '@/components/common/TextField'
import { useLogin } from '@/hooks/useLogin'
import { extractErrorMessage } from '@/lib/errors'

const loginSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: () => {
        const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
        navigate(from ? `${from.pathname}${from.search}` : '/', { replace: true })
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-50">로그인</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField
          label="이메일"
          id="email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register('email')}
        />
        <TextField
          label="비밀번호"
          id="password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          {...register('password')}
        />

        {login.isError && <p className="text-sm text-red-500">{extractErrorMessage(login.error)}</p>}

        <button
          type="submit"
          disabled={login.isPending}
          className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {login.isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <SocialLoginButtons />

      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        계정이 없으신가요?{' '}
        <Link to="/signup" className="font-medium text-primary-600 dark:text-primary-400">
          회원가입
        </Link>
      </p>
    </div>
  )
}
