import { useRef, useState } from 'react'

import { uploadFile } from '@/api/uploads'
import type { UploadCategory } from '@/api/uploads'
import { extractErrorMessage } from '@/lib/errors'
import { formatFileSize } from '@/lib/format'

export interface AttachmentInput {
  file_path: string
  original_filename: string
  size: number
}

interface MultiFileUploaderProps {
  label: string
  uploadCategory: UploadCategory
  value: AttachmentInput[]
  onChange: (files: AttachmentInput[]) => void
}

export function MultiFileUploader({ label, uploadCategory, value, onChange }: MultiFileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded: AttachmentInput[] = []
      for (const file of Array.from(files)) {
        const result = await uploadFile(uploadCategory, file)
        uploaded.push({ file_path: result.file_path, original_filename: file.name, size: file.size })
      }
      onChange([...value, ...uploaded])
    } catch (error) {
      setUploadError(extractErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <input
        ref={inputRef}
        type="file"
        multiple
        disabled={uploading}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
        className="text-sm text-neutral-600 dark:text-neutral-300"
      />
      {uploading && <p className="text-sm text-neutral-500 dark:text-neutral-400">업로드 중...</p>}
      {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
      {value.length > 0 && (
        <ul className="flex flex-col gap-1">
          {value.map((file, index) => (
            <li
              key={file.file_path}
              className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <span className="truncate text-neutral-700 dark:text-neutral-300">
                {file.original_filename} <span className="text-neutral-400">({formatFileSize(file.size)})</span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="shrink-0 text-xs font-medium text-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
