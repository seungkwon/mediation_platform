import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { TextField } from '@/components/common/TextField'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import type { QnaPost, QnaPostInput } from '@/types/qna'

const qnaSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(255),
  content: z.string().min(1, '내용을 입력해주세요.'),
})

type QnaFormValues = z.infer<typeof qnaSchema>

interface QnaFormProps {
  initial?: QnaPost
  onSubmit: (payload: QnaPostInput) => void
  isSubmitting?: boolean
  submitLabel: string
}

export function QnaForm({ initial, onSubmit, isSubmitting, submitLabel }: QnaFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QnaFormValues>({
    resolver: zodResolver(qnaSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
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
            uploadCategory="qna"
          />
        )}
      />
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
