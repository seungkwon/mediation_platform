import type { ComponentProps } from 'react'
import type { FieldError } from 'react-hook-form'

type TextFieldProps = ComponentProps<'input'> & {
  label: string
  error?: FieldError
}

export function TextField({ label, error, id, className, ...props }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={`rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 ${className ?? ''}`}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  )
}
