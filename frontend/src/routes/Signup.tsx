import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { TextField } from '@/components/common/TextField'
import { useSignup } from '@/hooks/useSignup'
import { extractErrorMessage } from '@/lib/errors'

const signupSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(100),
  email: z.email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.').max(100),
  phone: z.string().optional(),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) })
  const signup = useSignup()
  const navigate = useNavigate()

  const onSubmit = (values: SignupFormValues) => {
    signup.mutate(
      { ...values, phone: values.phone || undefined },
      { onSuccess: () => navigate('/', { replace: true }) },
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-50">회원가입</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="이름" id="name" autoComplete="name" error={errors.name} {...register('name')} />
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
          autoComplete="new-password"
          error={errors.password}
          {...register('password')}
        />
        <TextField
          label="전화번호 (선택)"
          id="phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
          {...register('phone')}
        />

        {signup.isError && <p className="text-sm text-red-500">{extractErrorMessage(signup.error)}</p>}

        <button
          type="submit"
          disabled={signup.isPending}
          className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {signup.isPending ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <SocialLoginButtons />

      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400">
          로그인
        </Link>
      </p>
    </div>
  )
}
