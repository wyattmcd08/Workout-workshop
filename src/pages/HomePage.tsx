import { useNavigate } from 'react-router-dom'
import { BoltIcon, FireIcon, PlusIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { MacroRings } from '@/features/nutrition/components/MacroRings'
import { useTodayNutrition } from '@/features/nutrition/hooks/useTodayNutrition'
import { logWater } from '@/features/nutrition/services/nutritionLog'
import { overallReadiness, useRecoveryStates } from '@/features/recovery/hooks/useRecovery'
import {
  useTodaysWorkout,
  useTrainingStreak,
  useWorkoutsThisWeek,
} from '@/features/workout/hooks/useWorkoutData'
import { useWeightEntries } from '@/features/progress/hooks/useWeightEntries'
import { WeightChart } from '@/features/progress/components/WeightChart'
import { useSettingsStore, useUnitSystem } from '@/store/settingsStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { formatWeight, kgToLb } from '@/utils/units'
import { formatSigned } from '@/utils/format'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const navigate = useNavigate()
  const nutrition = useTodayNutrition()
  const recovery = useRecoveryStates()
  const todaysWorkout = useTodaysWorkout()
  const streak = useTrainingStreak()
  const workoutsThisWeek = useWorkoutsThisWeek()
  const weightEntries = useWeightEntries(30)
  const unitSystem = useUnitSystem()
  const profile = useSettingsStore((s) => s.profile)
  const session = useWorkoutSessionStore((s) => s.session)
  const startEmpty = useWorkoutSessionStore((s) => s.startEmpty)

  const targets = profile.targets
  const consumed = nutrition?.totals.calories ?? 0
  const remaining = Math.max(0, targets.calories - consumed)
  const readiness = recovery ? overallReadiness(recovery) : 100

  const latestWeight = weightEntries?.at(-1)
  const firstWeight = weightEntries?.[0]
  const weightDelta =
    latestWeight && firstWeight && latestWeight.id !== firstWeight.id
      ? latestWeight.weightKg - firstWeight.weightKg
      : null

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-safe pb-tabbar">
      <header className="pt-6 pb-4">
        <p className="text-[13px] font-semibold tracking-wide text-content-secondary uppercase">
          {dateLabel}
        </p>
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">
          {greeting()}
          {profile.name ? `, ${profile.name}` : ''}
        </h1>
      </header>

      <div className="flex flex-col gap-3">
        {/* Calories + macros */}
        <Card onPress={() => navigate('/nutrition')}>
          <div className="flex items-center gap-5">
            <ProgressRing
              progress={targets.calories > 0 ? consumed / targets.calories : 0}
              size={104}
              strokeWidth={9}
              color="var(--color-orange)"
            >
              <div className="text-center">
                <p className="text-[22px] leading-none font-bold tabular-nums">
                  {Math.round(remaining).toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] font-medium text-content-secondary">left</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Calories</p>
              <p className="mb-3 text-[12px] text-content-secondary">
                {Math.round(consumed).toLocaleString()} of{' '}
                {targets.calories.toLocaleString()} eaten
              </p>
              <MacroRings totals={nutrition?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }} targets={targets} compact />
            </div>
          </div>
        </Card>

        {/* Today's training */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold">Today's Workout</p>
              <p className="mt-0.5 text-[12px] text-content-secondary">
                {session
                  ? 'Workout in progress'
                  : todaysWorkout
                    ? `${todaysWorkout.name} · ${todaysWorkout.totalSets} ${todaysWorkout.totalSets === 1 ? 'set' : 'sets'} done`
                    : 'Nothing logged yet'}
              </p>
            </div>
            {session ? (
              <Button size="sm" onClick={() => navigate('/workout/active')}>
                Resume
              </Button>
            ) : todaysWorkout ? (
              <Button size="sm" variant="secondary" onClick={() => navigate('/workout')}>
                View
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  startEmpty()
                  navigate('/workout/active')
                }}
              >
                <BoltIcon className="size-4" />
                Start
              </Button>
            )}
          </div>
        </Card>

        {/* Streak / recovery / weekly goal */}
        {profile.homeWidgets.stats ? (
        <div className="grid grid-cols-3 gap-3">
          <Card className="flex flex-col items-center gap-1 py-4" onPress={() => navigate('/workout')}>
            <FireIcon className="size-5 text-orange" />
            <p className="text-[22px] leading-none font-bold tabular-nums">{streak ?? 0}</p>
            <p className="text-center text-[11px] text-content-secondary">
              day streak
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1 py-4" onPress={() => navigate('/recovery')}>
            <ProgressRing
              progress={readiness / 100}
              size={40}
              strokeWidth={4}
              color={readiness >= 70 ? 'var(--color-accent)' : readiness >= 40 ? 'var(--color-yellow)' : 'var(--color-red)'}
            >
              <span className="text-[11px] font-bold tabular-nums">{readiness}</span>
            </ProgressRing>
            <p className="text-center text-[11px] text-content-secondary">readiness</p>
          </Card>
          <Card className="flex flex-col items-center gap-1 py-4" onPress={() => navigate('/progress')}>
            <p className="text-[22px] leading-none font-bold tabular-nums">
              {workoutsThisWeek ?? 0}
              <span className="text-[13px] font-semibold text-content-tertiary">
                /{profile.weeklyWorkoutGoal}
              </span>
            </p>
            <p className="mt-1 text-center text-[11px] text-content-secondary">
              workouts this week
            </p>
          </Card>
        </div>
        ) : null}

        {/* Hydration */}
        {profile.homeWidgets.hydration ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold">Hydration</p>
              <p className="mt-0.5 text-[12px] text-content-secondary">
                {((nutrition?.waterMl ?? 0) / 1000).toFixed(1)} of{' '}
                {(targets.waterMl / 1000).toFixed(1)} L
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => void logWater(250)}>
                <PlusIcon className="size-3.5" />
                250
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void logWater(500)}>
                <PlusIcon className="size-3.5" />
                500
              </Button>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{
                width: `${Math.min(100, ((nutrition?.waterMl ?? 0) / targets.waterMl) * 100)}%`,
              }}
            />
          </div>
        </Card>
        ) : null}

        {/* Weight trend */}
        {profile.homeWidgets.weightTrend &&
        weightEntries &&
        weightEntries.length >= 2 &&
        latestWeight ? (
          <Card onPress={() => navigate('/progress')}>
            <div className="mb-1 flex items-baseline justify-between">
              <p className="text-[15px] font-semibold">Weight Trend</p>
              <p className="text-[13px] font-semibold tabular-nums">
                {formatWeight(latestWeight.weightKg, unitSystem)}
                {weightDelta !== null ? (
                  <span className="ml-1.5 text-[12px] font-medium text-content-secondary">
                    {formatSigned(
                      unitSystem === 'metric' ? weightDelta : kgToLb(weightDelta),
                    )}{' '}
                    / 30d
                  </span>
                ) : null}
              </p>
            </div>
            <WeightChart entries={weightEntries} unitSystem={unitSystem} height={120} />
          </Card>
        ) : null}
      </div>
    </div>
  )
}
