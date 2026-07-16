import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { uploadFile } from '@/api/uploads'
import { TextField } from '@/components/common/TextField'
import { useUpdateMe } from '@/hooks/useUpdateMe'
import { extractErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(100),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function MyProfile() {
  const user = useAuthStore((state) => state.user)
  const updateMe = useUpdateMe()
  const [profileImagePath, setProfileImagePath] = useState<string | null>(user?.profile_image_path ?? null)
  const [activeRole, setActiveRole] = useState<UserRole>(user?.active_role ?? 'buyer')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  if (!user) return null

  const handleImageChange = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadFile('profiles', file)
      setProfileImagePath(result.file_path)
    } catch (error) {
      setUploadError(extractErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = (values: ProfileFormValues) => {
    setSaved(false)
    updateMe.mutate(
      { name: values.name, phone: values.phone || null, profile_image_path: profileImagePath, active_role: activeRole },
      { onSuccess: () => setSaved(true) },
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-50">내 정보 수정</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col items-center gap-3">
          {profileImagePath ? (
            <img
              src={mediaUrl(profileImagePath)}
              alt=""
              className="size-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
              사진 없음
            </div>
          )}
          <label className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400">
            {uploading ? '업로드 중...' : '사진 변경'}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="hidden"
              onChange={(event) => {
                handleImageChange(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </label>
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">이용 모드</label>
          <div className="flex gap-2">
            {(['buyer', 'seller'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  activeRole === role
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                {role === 'buyer' ? '구매자로 이용' : '판매자로 이용'}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            언제든지 다시 바꿀 수 있어요. 화면 상단 메뉴에서도 바로 전환할 수 있습니다.
          </p>
        </div>

        <TextField label="이름" id="name" autoComplete="name" error={errors.name} {...register('name')} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">이메일</label>
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            {user.email}
          </p>
        </div>

        <TextField
          label="전화번호"
          id="phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
          {...register('phone')}
        />

        <p className="text-sm text-neutral-400 dark:text-neutral-500">가입일 {formatDateTime(user.created_at)}</p>

        {updateMe.isError && <p className="text-sm text-red-500">{extractErrorMessage(updateMe.error)}</p>}
        {saved && !updateMe.isPending && <p className="text-sm text-primary-600 dark:text-primary-400">저장되었습니다.</p>}

        <button
          type="submit"
          disabled={updateMe.isPending || uploading}
          className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {updateMe.isPending ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}
