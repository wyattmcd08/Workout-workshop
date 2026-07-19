import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  suffix?: string
}

/** Labeled form input styled for the dark design system. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, suffix, className, id, ...inputProps },
  ref,
) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-content-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-12 w-full rounded-control bg-surface-sunken px-4 text-[16px] text-content',
            'placeholder:text-content-tertiary',
            'outline-none focus:ring-2 focus:ring-accent/60',
            error && 'ring-2 ring-red/60',
            suffix && 'pr-12',
            className,
          )}
          {...inputProps}
        />
        {suffix ? (
          <span className="absolute inset-y-0 right-4 flex items-center text-[14px] text-content-tertiary">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? <p className="text-[12px] text-red">{error}</p> : null}
    </div>
  )
})
