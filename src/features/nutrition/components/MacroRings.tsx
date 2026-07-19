import { ProgressRing } from '@/components/ui/ProgressRing'
import type { DailyTargets, MacroBreakdown } from '@/types'

interface MacroRingsProps {
  totals: MacroBreakdown
  targets: DailyTargets
  compact?: boolean
}

const MACROS = [
  { key: 'proteinG', label: 'Protein', color: 'var(--color-red)' },
  { key: 'carbsG', label: 'Carbs', color: 'var(--color-blue)' },
  { key: 'fatG', label: 'Fat', color: 'var(--color-yellow)' },
] as const

/** Protein / carbs / fat rings with grams consumed vs. target. */
export function MacroRings({ totals, targets, compact = false }: MacroRingsProps) {
  const size = compact ? 56 : 72
  const stroke = compact ? 5 : 6

  return (
    <div className="flex items-center justify-around">
      {MACROS.map((macro) => {
        const consumed = totals[macro.key]
        const target = targets[macro.key]
        return (
          <div key={macro.key} className="flex flex-col items-center gap-1.5">
            <ProgressRing
              progress={target > 0 ? consumed / target : 0}
              size={size}
              strokeWidth={stroke}
              color={macro.color}
            >
              <span className="text-[13px] font-bold tabular-nums">{Math.round(consumed)}</span>
            </ProgressRing>
            <span className="text-[11px] font-medium text-content-secondary">
              {macro.label} · {target}g
            </span>
          </div>
        )
      })}
    </div>
  )
}
