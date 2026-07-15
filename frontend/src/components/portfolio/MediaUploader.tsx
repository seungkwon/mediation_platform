import { useState } from 'react'

import { uploadFile } from '@/api/uploads'
import { mediaUrl } from '@/lib/media'
import type { PortfolioMediaInput } from '@/types/seller'

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

function inferMediaType(filename: string): 'image' | 'video' {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext) ? 'video' : 'image'
}

interface MediaUploaderProps {
  value: PortfolioMediaInput[]
  onChange: (media: PortfolioMediaInput[]) => void
}

export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const uploaded: PortfolioMediaInput[] = []
      for (const file of Array.from(files)) {
        const result = await uploadFile('portfolios', file)
        uploaded.push({
          media_type: inferMediaType(file.name),
          file_path: result.file_path,
          sort_order: value.length + uploaded.length,
        })
      }
      onChange([...value, ...uploaded])
    } catch {
      setError('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index).map((media, i) => ({ ...media, sort_order: i })))
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">이미지/동영상</label>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        disabled={uploading}
        onChange={(event) => handleFiles(event.target.files)}
        className="text-sm text-neutral-600 dark:text-neutral-300"
      />
      {uploading && <p className="text-sm text-neutral-500 dark:text-neutral-400">업로드 중...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((media, index) => (
            <div
              key={media.file_path}
              className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
            >
              {media.media_type === 'image' ? (
                <img src={mediaUrl(media.file_path)} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <video src={mediaUrl(media.file_path)} className="aspect-square w-full object-cover" muted />
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute top-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
