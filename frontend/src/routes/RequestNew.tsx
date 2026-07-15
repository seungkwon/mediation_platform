import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { createServiceRequest } from '@/api/serviceRequests'
import { uploadFile } from '@/api/uploads'
import { TextField } from '@/components/common/TextField'
import { useCategories } from '@/hooks/useCategories'
import { extractErrorMessage } from '@/lib/errors'
import type { AttachmentInput } from '@/types/serviceRequest'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

function isImageFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return IMAGE_EXTENSIONS.has(ext)
}

const requestSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(255),
  description: z.string().min(1, '설명을 입력해주세요.'),
  category_id: z.string().optional(),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  bid_deadline: z.string().min(1, '입찰 마감일시를 선택해주세요.'),
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function RequestNew() {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormValues>({ resolver: zodResolver(requestSchema) })

  const mutation = useMutation({
    mutationFn: (values: RequestFormValues) =>
      createServiceRequest({
        title: values.title,
        description: values.description,
        category_id: values.category_id || null,
        budget_min: values.budget_min ? Number(values.budget_min) : null,
        budget_max: values.budget_max ? Number(values.budget_max) : null,
        bid_deadline: new Date(values.bid_deadline).toISOString(),
        image_paths: imagePaths,
        attachments,
      }),
    onSuccess: (data) => navigate(`/requests/${data.id}`, { replace: true }),
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of Array.from(files)) {
        const result = await uploadFile('service_requests', file)
        if (isImageFile(file.name)) {
          setImagePaths((prev) => [...prev, result.file_path])
        } else {
          setAttachments((prev) => [...prev, { file_path: result.file_path, original_filename: file.name, size: file.size }])
        }
      }
    } catch {
      setUploadError('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">서비스 요청 작성</h1>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4" noValidate>
        <TextField label="제목" id="title" error={errors.title} {...register('title')} />

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            설명
          </label>
          <textarea
            id="description"
            rows={6}
            {...register('description')}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category_id" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            카테고리
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

        <div className="grid grid-cols-2 gap-4">
          <TextField label="최소 예산" id="budget_min" type="number" min={0} {...register('budget_min')} />
          <TextField label="최대 예산" id="budget_max" type="number" min={0} {...register('budget_max')} />
        </div>

        <TextField
          label="입찰 마감일시"
          id="bid_deadline"
          type="datetime-local"
          error={errors.bid_deadline}
          {...register('bid_deadline')}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="request-files" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            첨부 파일 (이미지/문서)
          </label>
          <input
            id="request-files"
            type="file"
            multiple
            disabled={uploading}
            onChange={(event) => handleFiles(event.target.files)}
            className="text-sm text-neutral-600 dark:text-neutral-300"
          />
          {uploading && <p className="text-sm text-neutral-500 dark:text-neutral-400">업로드 중...</p>}
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          {(imagePaths.length > 0 || attachments.length > 0) && (
            <ul className="flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-300">
              {imagePaths.map((path) => (
                <li key={path}>이미지: {path.split('/').pop()}</li>
              ))}
              {attachments.map((attachment) => (
                <li key={attachment.file_path}>파일: {attachment.original_filename}</li>
              ))}
            </ul>
          )}
        </div>

        {mutation.isError && <p className="text-sm text-red-500">{extractErrorMessage(mutation.error)}</p>}

        <button
          type="submit"
          disabled={mutation.isPending || uploading}
          className="rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {mutation.isPending ? '등록 중...' : '요청 등록'}
        </button>
      </form>
    </div>
  )
}
