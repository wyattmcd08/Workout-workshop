import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useDataStore } from '@/store/dataStore'
import type { Equipment, Exercise, MuscleGroup } from '@/types'
import { EQUIPMENT_LABELS, EQUIPMENT_OPTIONS, MUSCLE_GROUPS, MUSCLE_LABELS } from '@/types'
import { cn } from '@/utils/cn'
import { createId } from '@/utils/id'

interface CustomExerciseSheetProps {
  open: boolean
  onClose: () => void
  /** Called with the newly created exercise (e.g. to auto-select it). */
  onCreated?: (exercise: Exercise) => void
}

/**
 * Create a custom exercise: name, equipment, and the muscle groups it hits
 * (at least one primary; optional secondaries). Custom exercises join the
 * seed database everywhere the picker and library read from.
 */
export function CustomExerciseSheet({ open, onClose, onCreated }: CustomExerciseSheetProps) {
  const addCustomExercise = useDataStore((s) => s.addCustomExercise)

  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<Equipment>('barbell')
  const [primary, setPrimary] = useState<MuscleGroup[]>([])
  const [secondary, setSecondary] = useState<MuscleGroup[]>([])
  const [error, setError] = useState<string | null>(null)

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (open) {
      setName('')
      setEquipment('barbell')
      setPrimary([])
      setSecondary([])
      setError(null)
    }
  }, [open])

  const togglePrimary = (muscle: MuscleGroup) => {
    setError(null)
    setPrimary((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    )
    // A muscle can't be both primary and secondary.
    setSecondary((prev) => prev.filter((m) => m !== muscle))
  }

  const toggleSecondary = (muscle: MuscleGroup) => {
    if (primary.includes(muscle)) return
    setSecondary((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    )
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name your exercise')
      return
    }
    if (primary.length === 0) {
      setError('Pick at least one primary muscle')
      return
    }
    const exercise: Exercise = {
      id: createId(),
      name: trimmed,
      equipment,
      pattern: 'isolation',
      primaryMuscles: primary,
      secondaryMuscles: secondary,
      isCustom: true,
    }
    addCustomExercise(exercise)
    onCreated?.(exercise)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="New Exercise">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="custom-exercise-name"
            className="text-[13px] font-medium text-content-secondary"
          >
            Exercise name
          </label>
          <input
            id="custom-exercise-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="e.g. Incline DB Press"
            className="h-11 w-full rounded-control bg-surface-sunken px-3.5 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-content-secondary">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEquipment(option)}
                className={cn(
                  'h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                  equipment === option
                    ? 'bg-accent text-black'
                    : 'bg-surface-sunken text-content-secondary',
                )}
              >
                {EQUIPMENT_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-content-secondary">
            Primary muscles
            <span className="ml-1 text-content-tertiary">· what it mainly hits</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((muscle) => (
              <button
                key={muscle}
                type="button"
                onClick={() => togglePrimary(muscle)}
                className={cn(
                  'h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                  primary.includes(muscle)
                    ? 'bg-accent text-black'
                    : 'bg-surface-sunken text-content-secondary',
                )}
              >
                {MUSCLE_LABELS[muscle]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-content-secondary">
            Secondary muscles
            <span className="ml-1 text-content-tertiary">· optional</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((muscle) => {
              const isPrimary = primary.includes(muscle)
              return (
                <button
                  key={muscle}
                  type="button"
                  disabled={isPrimary}
                  onClick={() => toggleSecondary(muscle)}
                  className={cn(
                    'h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                    secondary.includes(muscle)
                      ? 'bg-accent text-black'
                      : 'bg-surface-sunken text-content-secondary',
                    isPrimary && 'opacity-30',
                  )}
                >
                  {MUSCLE_LABELS[muscle]}
                </button>
              )
            })}
          </div>
        </div>

        {error ? <p className="text-[13px] font-medium text-red">{error}</p> : null}

        <Button type="button" size="lg" fullWidth onClick={handleSave}>
          Save Exercise
        </Button>
      </div>
    </Sheet>
  )
}
