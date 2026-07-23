import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckIcon, EllipsisHorizontalIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ExerciseActionSheet } from '@/features/workout/components/ExerciseActionSheet'
import { ExerciseNoteSheet } from '@/features/workout/components/ExerciseNoteSheet'
import { ExercisePickerSheet } from '@/features/workout/components/ExercisePickerSheet'
import { RestTimerBar } from '@/features/workout/components/RestTimerBar'
import { saveCompletedWorkout } from '@/features/workout/services/workoutLog'
import { useSettingsStore, useUnitSystem } from '@/store/settingsStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import type { SetType, UnitSystem, WorkoutExercise, WorkoutSet } from '@/types'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/date'
import { fromDisplayWeight, toDisplayWeight, weightUnitLabel } from '@/utils/units'

function useElapsedSeconds(startedAt: number | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  if (!startedAt) return 0
  return Math.max(0, Math.round((now - startedAt) / 1000))
}

const NEXT_SET_TYPE: Record<SetType, SetType> = {
  working: 'warmup',
  warmup: 'drop',
  drop: 'working',
}

interface SetRowProps {
  index: number
  /** 1-based position among working/drop sets; warmups are labeled W. */
  workingNumber: number
  set: WorkoutSet
  unitSystem: UnitSystem
  onUpdate: (patch: Partial<Omit<WorkoutSet, 'id'>>) => void
  onRemove: () => void
}

function SetRow({ index, workingNumber, set, unitSystem, onUpdate, onRemove }: SetRowProps) {
  const displayWeight =
    set.weightKg !== null ? Number(toDisplayWeight(set.weightKg, unitSystem).toFixed(1)) : ''

  const typeLabel = set.type === 'warmup' ? 'W' : set.type === 'drop' ? 'D' : String(workingNumber)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Set ${index + 1} type: ${set.type}. Tap to change.`}
        onClick={() => onUpdate({ type: NEXT_SET_TYPE[set.type] })}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums transition-colors',
          set.type === 'warmup' && 'bg-yellow/15 text-yellow',
          set.type === 'drop' && 'bg-purple/15 text-purple',
          set.type === 'working' && 'text-content-tertiary',
        )}
      >
        {typeLabel}
      </button>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min={0}
        placeholder={weightUnitLabel(unitSystem)}
        aria-label={`Set ${index + 1} weight`}
        value={displayWeight}
        onChange={(e) => {
          const value = e.target.value
          onUpdate({
            weightKg: value === '' ? null : fromDisplayWeight(Number(value), unitSystem),
          })
        }}
        className="h-10 w-0 flex-1 rounded-xl bg-surface-sunken text-center text-[15px] font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="reps"
        aria-label={`Set ${index + 1} reps`}
        value={set.reps ?? ''}
        onChange={(e) => {
          const value = e.target.value
          onUpdate({ reps: value === '' ? null : Math.max(0, Math.round(Number(value))) })
        }}
        className="h-10 w-0 flex-1 rounded-xl bg-surface-sunken text-center text-[15px] font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
      />
      <button
        type="button"
        aria-label={set.completed ? `Mark set ${index + 1} incomplete` : `Complete set ${index + 1}`}
        onClick={() => onUpdate({ completed: !set.completed })}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
          set.completed ? 'bg-accent text-black' : 'bg-surface-sunken text-content-tertiary',
        )}
      >
        <CheckIcon className="size-5" />
      </button>
      <button
        type="button"
        aria-label={`Remove set ${index + 1}`}
        onClick={onRemove}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-content-tertiary"
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  )
}

export default function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const unitSystem = useUnitSystem()
  const session = useWorkoutSessionStore((s) => s.session)
  const addExercise = useWorkoutSessionStore((s) => s.addExercise)
  const removeExercise = useWorkoutSessionStore((s) => s.removeExercise)
  const replaceExercise = useWorkoutSessionStore((s) => s.replaceExercise)
  const moveExercise = useWorkoutSessionStore((s) => s.moveExercise)
  const linkSupersetWithNext = useWorkoutSessionStore((s) => s.linkSupersetWithNext)
  const unlinkSuperset = useWorkoutSessionStore((s) => s.unlinkSuperset)
  const setExerciseNotes = useWorkoutSessionStore((s) => s.setExerciseNotes)
  const addSet = useWorkoutSessionStore((s) => s.addSet)
  const removeSet = useWorkoutSessionStore((s) => s.removeSet)
  const updateSet = useWorkoutSessionStore((s) => s.updateSet)
  const finish = useWorkoutSessionStore((s) => s.finish)
  const cancel = useWorkoutSessionStore((s) => s.cancel)
  const startRest = useWorkoutSessionStore((s) => s.startRest)
  const defaultRestSeconds = useSettingsStore((s) => s.profile.defaultRestSeconds)

  // Picker is used both to add and to replace; replace carries the target id.
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; id: string } | null>(
    null,
  )
  const [menuExercise, setMenuExercise] = useState<WorkoutExercise | null>(null)
  const [noteExercise, setNoteExercise] = useState<WorkoutExercise | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const elapsed = useElapsedSeconds(session?.startedAt)

  useEffect(() => {
    if (!session) navigate('/workout', { replace: true })
  }, [session, navigate])

  if (!session) return null

  const completedSets = session.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0,
  )

  const handleFinish = async () => {
    const workout = finish()
    if (workout) await saveCompletedWorkout(workout)
    navigate('/workout')
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-safe pb-tabbar">
      <header className="flex items-center justify-between pt-6 pb-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">{session.name}</h1>
          <p className="text-[13px] text-content-secondary tabular-nums">
            {formatDuration(elapsed)} · {completedSets} {completedSets === 1 ? 'set' : 'sets'} done
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => setConfirmingCancel(true)}>
            Discard
          </Button>
          <Button size="sm" onClick={() => void handleFinish()} disabled={completedSets === 0}>
            Finish
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {session.exercises.map((exercise, exerciseIndex) => {
            const prev = session.exercises[exerciseIndex - 1]
            const inSuperset = Boolean(exercise.supersetId)
            const groupedWithPrev = inSuperset && prev?.supersetId === exercise.supersetId
            const isGroupStart = inSuperset && !groupedWithPrev
            return (
              <motion.div
                key={exercise.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              >
                <Card className={cn(inSuperset && 'border-l-[3px] border-l-purple')}>
                  {isGroupStart ? (
                    <span className="mb-2 inline-flex rounded-full bg-purple/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-purple uppercase">
                      Superset
                    </span>
                  ) : null}
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[16px] font-semibold">{exercise.exerciseName}</p>
                    <button
                      type="button"
                      aria-label={`Options for ${exercise.exerciseName}`}
                      onClick={() => setMenuExercise(exercise)}
                      className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-content-secondary"
                    >
                      <EllipsisHorizontalIcon className="size-5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {exercise.sets.map((set, index) => {
                      const workingNumber =
                        exercise.sets.slice(0, index + 1).filter((s) => s.type !== 'warmup').length
                      return (
                        <SetRow
                          key={set.id}
                          index={index}
                          workingNumber={workingNumber}
                          set={set}
                          unitSystem={unitSystem}
                          onUpdate={(patch) => {
                            updateSet(exercise.id, set.id, patch)
                            if (patch.completed === true) startRest(defaultRestSeconds)
                          }}
                          onRemove={() => removeSet(exercise.id, set.id)}
                        />
                      )
                    })}
                  </div>
                  {exercise.notes.trim() ? (
                    <button
                      type="button"
                      onClick={() => setNoteExercise(exercise)}
                      className="mt-2.5 w-full rounded-xl bg-surface-sunken px-3 py-2 text-left text-[13px] leading-relaxed text-content-secondary"
                    >
                      {exercise.notes}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => addSet(exercise.id)}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-surface-sunken text-[13px] font-semibold text-accent"
                  >
                    <PlusIcon className="size-4" />
                    Add Set
                  </button>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        <Button variant="secondary" size="lg" fullWidth onClick={() => setPicker({ mode: 'add' })}>
          <PlusIcon className="size-5" />
          Add Exercise
        </Button>
      </div>

      <RestTimerBar />

      <ExercisePickerSheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(exercise) => {
          if (picker?.mode === 'replace') replaceExercise(picker.id, exercise)
          else addExercise(exercise)
          setPicker(null)
        }}
      />

      <ExerciseActionSheet
        exercise={menuExercise}
        isFirst={
          !!menuExercise && session.exercises.findIndex((e) => e.id === menuExercise.id) === 0
        }
        isLast={
          !!menuExercise &&
          session.exercises.findIndex((e) => e.id === menuExercise.id) ===
            session.exercises.length - 1
        }
        inSuperset={Boolean(menuExercise?.supersetId)}
        onClose={() => setMenuExercise(null)}
        onAddNote={() => {
          setNoteExercise(menuExercise)
          setMenuExercise(null)
        }}
        onReplace={() => {
          if (menuExercise) setPicker({ mode: 'replace', id: menuExercise.id })
          setMenuExercise(null)
        }}
        onMoveUp={() => {
          if (menuExercise) moveExercise(menuExercise.id, 'up')
          setMenuExercise(null)
        }}
        onMoveDown={() => {
          if (menuExercise) moveExercise(menuExercise.id, 'down')
          setMenuExercise(null)
        }}
        onToggleSuperset={() => {
          if (menuExercise) {
            if (menuExercise.supersetId) unlinkSuperset(menuExercise.id)
            else linkSupersetWithNext(menuExercise.id)
          }
          setMenuExercise(null)
        }}
        onRemove={() => {
          if (menuExercise) removeExercise(menuExercise.id)
          setMenuExercise(null)
        }}
      />

      <ExerciseNoteSheet
        exercise={noteExercise}
        onClose={() => setNoteExercise(null)}
        onSave={(notes) => {
          if (noteExercise) setExerciseNotes(noteExercise.id, notes)
        }}
      />

      <AnimatePresence>
        {confirmingCancel ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-safe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="w-full max-w-lg rounded-card bg-surface-raised p-5"
            >
              <p className="text-[16px] font-semibold">Discard this workout?</p>
              <p className="mt-1 mb-4 text-[13px] text-content-secondary">
                All sets from this session will be lost. This can't be undone.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="destructive"
                  fullWidth
                  onClick={() => {
                    cancel()
                    navigate('/workout')
                  }}
                >
                  Discard Workout
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setConfirmingCancel(false)}>
                  Keep Going
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
