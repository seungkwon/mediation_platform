import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { TextField } from '@/components/common/TextField'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import type { Notice, NoticeInput } from '@/types/notice'

const noticeSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(255),
  content: z.string().min(1, '내용을 입력해주세요.'),
  status: z.enum(['draft', 'published']),
})

type NoticeFormValues = z.infer<typeof noticeSchema>

interface NoticeFormProps {
  initial?: Notice
  onSubmit: (payload: NoticeInput) => void
  isSubmitting?: boolean
  submitLabel: string
}

export function NoticeForm({ initial, onSubmit, isSubmitting, submitLabel }: NoticeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      status: initial?.status ?? 'draft',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <TextField label="제목" id="title" error={errors.title} {...register('title')} />
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <RichTextEditor
            label="내용"
            value={field.value}
            onChange={field.onChange}
            error={errors.content?.message}
            uploadCategory="notices"
          />
        )}
      />
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
