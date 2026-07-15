import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

import type { UploadCategory } from '@/api/uploads'
import { uploadFile } from '@/api/uploads'

import { applyCellBackground, applyCellBorders, RichImage, RichTableCell, RichTableHeader, RichVideo } from './richTextExtensions'
import type { BorderSide } from './richTextExtensions'

interface RichTextEditorProps {
  label?: string
  value: string
  onChange?: (html: string) => void
  error?: string
  readOnly?: boolean
  uploadCategory?: UploadCategory
}

const TABLE_CLASS =
  '[&_table]:my-2 [&_td]:p-2 [&_th]:bg-neutral-100 [&_th]:p-2 [&_th]:text-left dark:[&_th]:bg-neutral-800'

const CONTENT_CLASS =
  `min-h-[240px] rounded-b-lg border border-t-0 border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-2 [&_img]:my-2 [&_video]:my-2 ${TABLE_CLASS}`

const READ_ONLY_CONTENT_CLASS =
  `text-base leading-relaxed text-neutral-800 dark:text-neutral-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-3 [&_img]:my-3 [&_video]:my-3 ${TABLE_CLASS}`

const BORDER_SIDE_OPTIONS: { side: BorderSide; label: string }[] = [
  { side: 'left', label: '왼쪽' },
  { side: 'right', label: '오른쪽' },
  { side: 'top', label: '위' },
  { side: 'bottom', label: '아래' },
  { side: 'inside', label: '내부' },
]

export function RichTextEditor({
  label,
  value,
  onChange,
  error,
  readOnly = false,
  uploadCategory = 'portfolios',
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [borderSides, setBorderSides] = useState<Set<BorderSide>>(new Set())
  const [borderColor, setBorderColor] = useState('#ef4444')
  const [borderWidth, setBorderWidth] = useState(1)
  const [cellBgColor, setCellBgColor] = useState('#fff7ed')

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph', 'richImage', 'richVideo'] }),
      Table.configure({ resizable: true }),
      TableRow,
      RichTableHeader,
      RichTableCell,
      RichImage,
      RichVideo,
    ],
    content: value,
    editable: !readOnly,
    onUpdate: readOnly ? undefined : ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: { class: readOnly ? READ_ONLY_CONTENT_CLASS : CONTENT_CLASS },
    },
  })

  const toggleBorderSide = (side: BorderSide) => {
    setBorderSides((current) => {
      const next = new Set(current)
      if (next.has(side)) next.delete(side)
      else next.add(side)
      return next
    })
  }

  if (readOnly) {
    return <EditorContent editor={editor} />
  }

  const insertFile = async (file: File, kind: 'image' | 'video') => {
    if (!editor) return
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadFile(uploadCategory, file)
      if (kind === 'image') {
        editor.chain().focus().insertRichImage(result.file_path).run()
      } else {
        editor.chain().focus().insertRichVideo(result.file_path).run()
      }
    } catch {
      setUploadError('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <div className="flex flex-col">
        <div className="sticky top-14 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border border-neutral-300 bg-neutral-50 p-1.5 dark:border-neutral-700 dark:bg-neutral-800">
          <ToolbarButton active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>
            굵게
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            기울임
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive('heading', { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            제목
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            목록
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            번호 목록
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
          <ToolbarButton
            active={editor?.isActive({ textAlign: 'left' })}
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          >
            왼쪽
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: 'center' })}
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          >
            가운데
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: 'right' })}
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          >
            오른쪽
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
          <ToolbarButton onClick={() => imageInputRef.current?.click()} disabled={uploading}>
            이미지
          </ToolbarButton>
          <ToolbarButton onClick={() => videoInputRef.current?.click()} disabled={uploading}>
            동영상
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
          <ToolbarButton onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            표 삽입
          </ToolbarButton>
          {editor?.isActive('table') && (
            <>
              <ToolbarButton onClick={() => editor?.chain().focus().addRowAfter().run()}>행 추가</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().addColumnAfter().run()}>열 추가</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().deleteRow().run()}>행 삭제</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().deleteColumn().run()}>열 삭제</ToolbarButton>
              <ToolbarButton
                disabled={!editor?.can().mergeCells()}
                onClick={() => editor?.chain().focus().mergeCells().run()}
              >
                셀 병합
              </ToolbarButton>
              <ToolbarButton
                disabled={!editor?.can().splitCell()}
                onClick={() => editor?.chain().focus().splitCell().run()}
              >
                셀 분할
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().deleteTable().run()}>표 삭제</ToolbarButton>
              <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">선택 영역 테두리:</span>
              {BORDER_SIDE_OPTIONS.map(({ side, label: sideLabel }) => (
                <ToolbarButton key={side} active={borderSides.has(side)} onClick={() => toggleBorderSide(side)}>
                  {sideLabel}
                </ToolbarButton>
              ))}
              <input
                type="color"
                value={borderColor}
                onChange={(event) => setBorderColor(event.target.value)}
                title="테두리 색상"
                className="h-7 w-7 cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
              />
              <select
                value={borderWidth}
                onChange={(event) => setBorderWidth(Number(event.target.value))}
                title="테두리 두께"
                className="rounded border border-neutral-300 bg-white px-1 py-1 text-xs dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value={0}>없음</option>
                <option value={1}>1px</option>
                <option value={2}>2px</option>
                <option value={3}>3px</option>
              </select>
              <ToolbarButton
                disabled={borderSides.size === 0}
                onClick={() => editor && applyCellBorders(editor, borderSides, borderColor, borderWidth)}
              >
                테두리 적용
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">셀 배경:</span>
              <input
                type="color"
                value={cellBgColor}
                onChange={(event) => {
                  setCellBgColor(event.target.value)
                  if (editor) applyCellBackground(editor, event.target.value)
                }}
                title="셀 배경색"
                className="h-7 w-7 cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
              />
            </>
          )}
          {uploading && <span className="text-xs text-neutral-500 dark:text-neutral-400">업로드 중...</span>}
        </div>
        <EditorContent editor={editor} />
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) insertFile(file, 'image')
          event.target.value = ''
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) insertFile(file, 'video')
          event.target.value = ''
        }}
      />
      {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

interface ToolbarButtonProps {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarButton({ active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        active
          ? 'bg-primary-500 text-white'
          : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  )
}
