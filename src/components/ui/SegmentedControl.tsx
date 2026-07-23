import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  /** Shared layoutId so only one control animates its thumb at a time. */
  layoutId?: string
}

/** iOS-style segmented control with a spring-animated selection thumb. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId = 'segmented-thumb',
}: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-1 rounded-control bg-surface-sunken p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex-1 rounded-[0.6rem] py-2 text-[13px] font-semibold transition-colors',
              active ? 'text-content' : 'text-content-secondary',
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[0.6rem] bg-surface-raised shadow-card"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
