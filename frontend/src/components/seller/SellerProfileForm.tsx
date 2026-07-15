import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { TextField } from '@/components/common/TextField'
import { useCategories } from '@/hooks/useCategories'
import type { SellerProfile, SellerProfileInput } from '@/types/seller'

const sellerProfileSchema = z.object({
  headline: z.string().max(255).optional(),
  bio: z.string().optional(),
  category_id: z.string().optional(),
  career_years: z.string().optional(),
})

type SellerProfileFormValues = z.infer<typeof sellerProfileSchema>

interface SellerProfileFormProps {
  initial?: SellerProfile
  onSubmit: (payload: SellerProfileInput) => void
  isSubmitting?: boolean
  submitLabel: string
}

export function SellerProfileForm({ initial, onSubmit, isSubmitting, submitLabel }: SellerProfileFormProps) {
  const { data: categories } = useCategories()
  const { register, handleSubmit } = useForm<SellerProfileFormValues>({
    resolver: zodResolver(sellerProfileSchema),
    defaultValues: {
      headline: initial?.headline ?? '',
      bio: initial?.bio ?? '',
      category_id: initial?.category_id ?? '',
      career_years: initial?.career_years != null ? String(initial.career_years) : '',
    },
  })

  const submit = (values: SellerProfileFormValues) => {
    onSubmit({
      headline: values.headline || null,
      bio: values.bio || null,
      category_id: values.category_id || null,
      career_years: values.career_years ? Number(values.career_years) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <TextField label="한줄 소개" id="headline" {...register('headline')} />
      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          상세 소개
        </label>
        <textarea
          id="bio"
          rows={6}
          {...register('bio')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category_id" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          주력 카테고리
        </label>
        <select
          id="category_id"
          {...register('category_id')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="">선택 안 함</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <TextField label="경력(년)" id="career_years" type="number" min={0} {...register('career_years')} />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
      >
        {isSubmitting ? '저장 중...' : submitLabel}
      </button>
    </form>
  )
}
