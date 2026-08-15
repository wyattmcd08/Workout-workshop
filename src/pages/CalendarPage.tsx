import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import {
  buildMonthMatrix,
  dateKeyOf,
  dayFlags,
  useCalendarData,
  type DaySummary,
} from '@/features/calendar/hooks/useCalendar'
import { useUnitSystem } from '@/store/settingsStore'
import { MEAL_LABELS } from '@/types'
import { cn } from '@/utils/cn'
import { parseDateKey, todayKey } from '@/utils/date'
import { formatCompact } from '@/utils/format'
import { formatWeight, toDisplayWeight, weightUnitLabel } from '@/utils/units'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const FLAG_STYLES = [
  { key: 'workout', color: 'var(--color-accent)' },
  { key: 'nutrition', color: 'var(--color-orange)' },
  { key: 'weight', color: 'var(--color-blue)' },
  { key: 'plan', color: 'var(--color-purple)' },
] as const

function DayDetail({ dateKey, summary }: { dateKey: string; summary: DaySummary | undefined }) {
  const unitSystem = useUnitSystem()
  const date = parseDateKey(dateKey)
  const label = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const hasAnything =
    summary &&
    (summary.workouts.length > 0 ||
      summary.calories > 0 ||
      summary.weightKg != null ||
      summary.plannedMeals.length > 0)

  return (
    <div className="mt-5">
      <p className="mb-2 px-1 text-[13px] font-semibold text-content-secondary">{label}</p>
      {!hasAnything ? (
        <Card>
          <p className="py-4 text-center text-[14px] text-content-secondary">
            Nothing logged this day.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {summary!.workouts.map((workout) => (
            <Card key={workout.id}>
              <div className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: 'var(--color-accent)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{workout.name}</p>
                  <p className="text-[12px] text-content-secondary tabular-nums">
                    {workout.totalSets} sets ·{' '}
                    {formatCompact(toDisplayWeight(workout.totalVolumeKg, unitSystem))}{' '}
                    {weightUnitLabel(unitSystem)} volume
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {summary!.calories > 0 ? (
            <Card>
              <div className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: 'var(--color-orange)' }} />
                <p className="text-[14px]">
                  <span className="font-semibold tabular-nums">
                    {Math.round(summary!.calories).toLocaleString()}
                  </span>{' '}
                  cal ·{' '}
                  <span className="font-semibold tabular-nums">
                    {Math.round(summary!.proteinG)}g
                  </span>{' '}
                  protein
                </p>
              </div>
            </Card>
          ) : null}

          {summary!.weightKg != null ? (
            <Card>
              <div className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: 'var(--color-blue)' }} />
                <p className="text-[14px]">
                  Weigh-in{' '}
                  <span className="font-semibold tabular-nums">
                    {formatWeight(summary!.weightKg, unitSystem)}
                  </span>
                </p>
              </div>
            </Card>
          ) : null}

          {summary!.plannedMeals.length > 0 ? (
            <Card>
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: 'var(--color-purple)' }} />
                <p className="text-[14px] font-semibold">Planned meals</p>
              </div>
              <ul className="flex flex-col gap-1 pl-4.5">
                {summary!.plannedMeals.map((meal, index) => (
                  <li key={index} className="text-[13px] text-content-secondary">
                    {MEAL_LABELS[meal.mealType]} · {meal.recipeName}
                    {meal.servings !== 1 ? ` (${meal.servings}×)` : ''}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const data = useCalendarData()
  const now = new Date()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selectedKey, setSelectedKey] = useState(todayKey())

  const weeks = useMemo(() => buildMonthMatrix(view.year, view.month), [view])
  const today = todayKey()

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const jumpToToday = () => {
    setView({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedKey(today)
  }

  return (
    <Screen
      title="Calendar"
      subtitle="More"
      headerAccessory={
        <button
          type="button"
          onClick={jumpToToday}
          className="rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-accent"
        >
          Today
        </button>
      }
    >
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-content-secondary"
          >
            <ChevronLeftIcon className="size-4.5" />
          </button>
          <p className="text-[16px] font-bold">
            {MONTHS[view.month]} {view.year}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-content-secondary"
          >
            <ChevronRightIcon className="size-4.5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((day, index) => (
            <span
              key={index}
              className="py-1 text-center text-[11px] font-semibold text-content-tertiary"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date) => {
            const key = dateKeyOf(date)
            const inMonth = date.getMonth() === view.month
            const isToday = key === today
            const isSelected = key === selectedKey
            const flags = dayFlags(data.get(key))
            const activeFlags = FLAG_STYLES.filter((f) => flags[f.key])
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl',
                  isSelected && 'bg-accent',
                  !isSelected && isToday && 'bg-surface-sunken',
                )}
              >
                <span
                  className={cn(
                    'text-[13px] tabular-nums',
                    isSelected
                      ? 'font-bold text-black'
                      : isToday
                        ? 'font-bold text-accent'
                        : inMonth
                          ? 'text-content'
                          : 'text-content-tertiary',
                  )}
                >
                  {date.getDate()}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {activeFlags.map((f) => (
                    <span
                      key={f.key}
                      className="size-1.5 rounded-full"
                      style={{ background: isSelected ? 'rgb(0 0 0 / 0.55)' : f.color }}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <DayDetail dateKey={selectedKey} summary={data.get(selectedKey)} />
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}
