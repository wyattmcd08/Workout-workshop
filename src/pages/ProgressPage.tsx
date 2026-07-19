import { useMemo, useState } from 'react'
import { PlusIcon, ScaleIcon } from '@heroicons/react/24/solid'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { AddWeightSheet } from '@/features/progress/components/AddWeightSheet'
import { WeightChart } from '@/features/progress/components/WeightChart'
import { useWeightEntries } from '@/features/progress/hooks/useWeightEntries'
import { useRecentWorkouts } from '@/features/workout/hooks/useWorkoutData'
import { useSettingsStore, useUnitSystem } from '@/store/settingsStore'
import { kgToLb, formatWeight } from '@/utils/units'
import { formatSigned } from '@/utils/format'
import { parseDateKey } from '@/utils/date'

interface WeekBucket {
  label: string
  workouts: number
}

/** Buckets the last 8 weeks of workouts by week starting Monday. */
function useWeeklyTraining(): WeekBucket[] {
  const workouts = useRecentWorkouts(100)
  return useMemo(() => {
    const buckets: WeekBucket[] = []
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    for (let i = 7; i >= 0; i -= 1) {
      const start = new Date(monday)
      start.setDate(monday.getDate() - i * 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      const count = (workouts ?? []).filter((w) => {
        const d = parseDateKey(w.dateKey)
        return d >= start && d < end
      }).length
      buckets.push({
        label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        workouts: count,
      })
    }
    return buckets
  }, [workouts])
}

export default function ProgressPage() {
  const unitSystem = useUnitSystem()
  const weightEntries = useWeightEntries(90)
  const weeklyTraining = useWeeklyTraining()
  const weeklyGoal = useSettingsStore((s) => s.profile.weeklyWorkoutGoal)
  const [sheetOpen, setSheetOpen] = useState(false)

  const latest = weightEntries?.at(-1)
  const first = weightEntries?.[0]
  const deltaKg = latest && first && latest.id !== first.id ? latest.weightKg - first.weightKg : null

  return (
    <Screen
      title="Progress"
      headerAccessory={
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <PlusIcon className="size-4" />
          Weigh In
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <SectionHeader title="Body Weight" />
          {weightEntries && weightEntries.length >= 2 ? (
            <Card>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-[24px] font-bold tabular-nums">
                  {latest ? formatWeight(latest.weightKg, unitSystem) : '—'}
                </p>
                {deltaKg !== null ? (
                  <p className="text-[13px] font-medium text-content-secondary tabular-nums">
                    {formatSigned(unitSystem === 'metric' ? deltaKg : kgToLb(deltaKg))} over 90d
                  </p>
                ) : null}
              </div>
              <WeightChart entries={weightEntries} unitSystem={unitSystem} />
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={ScaleIcon}
                title={latest ? 'One more weigh-in to go' : 'No weigh-ins yet'}
                message="Log your weight a couple of times and your trend line will appear here."
                action={
                  <Button size="sm" onClick={() => setSheetOpen(true)}>
                    Log weight
                  </Button>
                }
              />
            </Card>
          )}
        </section>

        <section>
          <SectionHeader title="Training Consistency" />
          <Card>
            <p className="mb-3 text-[12px] text-content-secondary">
              Workouts per week · goal {weeklyGoal}
            </p>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTraining} margin={{ top: 4, right: 0, bottom: 0, left: -30 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--color-content-tertiary)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--color-content-tertiary)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar
                    dataKey="workouts"
                    radius={[5, 5, 5, 5]}
                    fill="var(--color-accent)"
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      </div>

      <AddWeightSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  )
}
