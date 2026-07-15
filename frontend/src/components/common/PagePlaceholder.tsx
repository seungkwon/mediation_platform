import type { ReactNode } from 'react'

interface PagePlaceholderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{title}</h1>
      {description && <p className="text-neutral-500 dark:text-neutral-400">{description}</p>}
      {children}
    </div>
  )
}
