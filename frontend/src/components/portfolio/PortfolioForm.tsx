import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { TextField } from '@/components/common/TextField'
import type { PortfolioMediaInput, PortfolioPost, PortfolioPostInput } from '@/types/seller'

import { MediaUploader } from './MediaUploader'

const portfolioSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(255),
  content: z.string().min(1, '내용을 입력해주세요.'),
  status: z.enum(['draft', 'published']),
})

type PortfolioFormValues = z.infer<typeof portfolioSchema>

interface PortfolioFormProps {
  initial?: PortfolioPost
  onSubmit: (payload: PortfolioPostInput) => void
  isSubmitting?: boolean
  submitLabel: string
}

export function PortfolioForm({ initial, onSubmit, isSubmitting, submitLabel }: PortfolioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      status: initial?.status ?? 'draft',
    },
  })
  const [media, setMedia] = useState<PortfolioMediaInput[]>(
    initial?.media.map(({ media_type, file_path, sort_order }) => ({ media_type, file_path, sort_order })) ?? [],
  )

  const submit = (values: PortfolioFormValues) => {
    onSubmit({ ...values, media })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <TextField label="제목" id="title" error={errors.title} {...register('title')} />
      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          내용
        </label>
        <textarea
          id="content"
          rows={10}
          {...register('content')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
      </div>
      <MediaUploader value={media} onChange={setMedia} />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="radio" value="draft" {...register('status')} /> 초안
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="radio" value="published" {...register('status')} /> 게시
        </label>
      </div>
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
