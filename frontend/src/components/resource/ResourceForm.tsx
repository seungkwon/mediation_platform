import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { TextField } from '@/components/common/TextField'
import type { AttachmentInput } from '@/components/common/MultiFileUploader'
import { MultiFileUploader } from '@/components/common/MultiFileUploader'
import { RichTextEditor } from '@/components/richtext/RichTextEditor'
import type { ResourcePost, ResourcePostInput } from '@/types/resource'

const resourceSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(255),
  content: z.string().min(1, '내용을 입력해주세요.'),
  status: z.enum(['draft', 'published']),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

interface ResourceFormProps {
  initial?: ResourcePost
  onSubmit: (payload: ResourcePostInput) => void
  isSubmitting?: boolean
  submitLabel: string
}

export function ResourceForm({ initial, onSubmit, isSubmitting, submitLabel }: ResourceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      status: initial?.status ?? 'draft',
    },
  })
  const [attachments, setAttachments] = useState<AttachmentInput[]>(
    initial?.attachments.map(({ file_path, original_filename, size }) => ({ file_path, original_filename, size })) ??
      [],
  )

  const submit = (values: ResourceFormValues) => {
    onSubmit({
      ...values,
      attachments: attachments.map((file, index) => ({ ...file, sort_order: index })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
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
            uploadCategory="resources"
          />
        )}
      />
      <MultiFileUploader
        label="첨부파일 (파일당 최대 500MB)"
        uploadCategory="resources"
        value={attachments}
        onChange={setAttachments}
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
