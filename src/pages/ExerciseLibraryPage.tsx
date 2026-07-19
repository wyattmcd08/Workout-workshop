import { useMemo, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Screen } from '@/components/ui/Screen'
import { useExercises } from '@/features/workout/hooks/useWorkoutData'
import type { MuscleGroup } from '@/types'
import { MUSCLE_LABELS } from '@/types'
import { cn } from '@/utils/cn'

const FILTERS: Array<{ label: string; muscles: MuscleGroup[] }> = [
  { label: 'All', muscles: [] },
  { label: 'Chest', muscles: ['chest'] },
  { label: 'Back', muscles: ['lats', 'upper-back', 'lower-back', 'traps'] },
  { label: 'Shoulders', muscles: ['front-delts', 'side-delts', 'rear-delts'] },
  { label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
  { label: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors'] },
  { label: 'Core', muscles: ['abs', 'obliques'] },
]

export default function ExerciseLibraryPage() {
  const exercises = useExercises()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const visible = useMemo(() => {
    if (!exercises) return []
    const activeFilter = FILTERS.find((f) => f.label === filter)
    const normalized = query.trim().toLowerCase()
    return exercises.filter((exercise) => {
      if (normalized && !exercise.name.toLowerCase().includes(normalized)) return false
      if (activeFilter && activeFilter.muscles.length > 0) {
        if (!exercise.primaryMuscles.some((m) => activeFilter.muscles.includes(m))) return false
      }
      return true
    })
  }, [exercises, query, filter])

  return (
    <Screen title="Exercises" subtitle="Library">
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-content-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          aria-label="Search exercises"
          className="h-11 w-full rounded-control bg-surface pr-4 pl-10 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
        />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.label)}
            className={cn(
              'h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
              filter === f.label ? 'bg-accent text-black' : 'bg-surface text-content-secondary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="overflow-hidden rounded-card bg-surface">
        {visible.map((exercise, index) => (
          <li
            key={exercise.id}
            className={cn('px-4 py-3.5', index > 0 && 'border-t border-divider')}
          >
            <p className="text-[15px] font-semibold">{exercise.name}</p>
            <p className="mt-0.5 text-[12px] text-content-tertiary capitalize">
              {exercise.equipment} ·{' '}
              {exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
            </p>
          </li>
        ))}
        {exercises && visible.length === 0 ? (
          <li className="px-4 py-10 text-center text-[14px] text-content-secondary">
            No exercises match your search.
          </li>
        ) : null}
      </ul>
    </Screen>
  )
}
