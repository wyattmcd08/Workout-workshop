import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BoltIcon,
  BookmarkIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useRecentWorkouts, useTemplates } from '@/features/workout/hooks/useWorkoutData'
import {
  createTemplateFromWorkout,
  deleteTemplate,
  touchTemplate,
} from '@/features/workout/services/templates'
import { useUnitSystem } from '@/store/settingsStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { formatDuration, formatRelativeDay } from '@/utils/date'
import { formatCompact } from '@/utils/format'
import { toDisplayWeight, weightUnitLabel } from '@/utils/units'

export default function WorkoutPage() {
  const navigate = useNavigate()
  const recentWorkouts = useRecentWorkouts()
  const templates = useTemplates()
  const unitSystem = useUnitSystem()
  const session = useWorkoutSessionStore((s) => s.session)
  const startEmpty = useWorkoutSessionStore((s) => s.startEmpty)
  const startFromTemplate = useWorkoutSessionStore((s) => s.startFromTemplate)
  const [savedTemplateFor, setSavedTemplateFor] = useState<string | null>(null)

  const start = () => {
    if (!session) startEmpty()
    navigate('/workout/active')
  }

  return (
    <Screen title="Workout">
      <div className="flex flex-col gap-6">
        {session ? (
          <Card className="border border-accent/30 bg-accent-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold">Workout in progress</p>
                <p className="mt-0.5 text-[12px] text-content-secondary">
                  {session.exercises.length}{' '}
                  {session.exercises.length === 1 ? 'exercise' : 'exercises'} so far
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/workout/active')}>
                <PlayIcon className="size-4" />
                Resume
              </Button>
            </div>
          </Card>
        ) : (
          <Button size="lg" fullWidth onClick={start}>
            <BoltIcon className="size-5" />
            Start Empty Workout
          </Button>
        )}

        <Card onPress={() => navigate('/workout/exercises')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-muted">
                <BookOpenIcon className="size-5 text-accent" />
              </div>
              <div>
                <p className="text-[15px] font-semibold">Exercise Library</p>
                <p className="text-[12px] text-content-secondary">
                  Browse every movement in the database
                </p>
              </div>
            </div>
            <ChevronRightIcon className="size-4 text-content-tertiary" />
          </div>
        </Card>

        {templates && templates.length > 0 ? (
          <section>
            <SectionHeader title="Templates" />
            <div className="flex flex-col gap-2.5">
              {templates.map((template) => (
                <Card key={template.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold">{template.name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-content-secondary">
                        {template.exercises.map((e) => e.exerciseName).join(' · ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete template ${template.name}`}
                      onClick={() => void deleteTemplate(template.id)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-content-tertiary"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => {
                        startFromTemplate(template)
                        void touchTemplate(template.id)
                        navigate('/workout/active')
                      }}
                    >
                      <PlayIcon className="size-3.5" />
                      Start
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader title="History" />
          {recentWorkouts && recentWorkouts.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {recentWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="text-[15px] font-semibold">{workout.name}</p>
                    <p className="text-[12px] text-content-tertiary">
                      {formatRelativeDay(workout.startedAt)}
                    </p>
                  </div>
                  <p className="mb-2 truncate text-[12px] text-content-secondary">
                    {workout.exercises.map((e) => e.exerciseName).join(' · ')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-[12px] text-content-secondary">
                      <span>
                        <span className="font-semibold text-content tabular-nums">
                          {workout.totalSets}
                        </span>{' '}
                        sets
                      </span>
                      <span>
                        <span className="font-semibold text-content tabular-nums">
                          {formatCompact(toDisplayWeight(workout.totalVolumeKg, unitSystem))}
                        </span>{' '}
                        {weightUnitLabel(unitSystem)} volume
                      </span>
                      <span>
                        <span className="font-semibold text-content tabular-nums">
                          {formatDuration(workout.durationSeconds)}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void createTemplateFromWorkout(workout).then(() =>
                          setSavedTemplateFor(workout.id),
                        )
                      }}
                      disabled={savedTemplateFor === workout.id}
                      className="flex items-center gap-1 text-[12px] font-semibold text-accent disabled:text-content-tertiary"
                    >
                      {savedTemplateFor === workout.id ? (
                        <>
                          <CheckIcon className="size-3.5" />
                          Saved
                        </>
                      ) : (
                        <>
                          <BookmarkIcon className="size-3.5" />
                          Template
                        </>
                      )}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : recentWorkouts ? (
            <Card>
              <EmptyState
                icon={BoltIcon}
                title="No workouts yet"
                message="Your training history will live here. Start your first session to begin building momentum."
                action={<Button size="sm" onClick={start}>Start a workout</Button>}
              />
            </Card>
          ) : null}
        </section>
      </div>
    </Screen>
  )
}
