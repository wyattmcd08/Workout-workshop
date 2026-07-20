import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/solid'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useExerciseSummary } from '@/features/analytics/hooks/useAnalytics'
import { useUnitSystem } from '@/store/settingsStore'
import { formatShortDate } from '@/utils/date'
import { formatCompact } from '@/utils/format'
import { toDisplayWeight, weightUnitLabel } from '@/utils/units'

export default function ExerciseAnalyticsPage() {
  const { exerciseId = '' } = useParams()
  const navigate = useNavigate()
  const unitSystem = useUnitSystem()
  const summary = useExerciseSummary(exerciseId)

  const chartData = useMemo(
    () =>
      (summary?.sessions ?? []).map((session) => ({
        label: formatShortDate(session.completedAt),
        e1rm: Math.round(toDisplayWeight(session.bestE1rmKg, unitSystem)),
      })),
    [summary, unitSystem],
  )

  // Loading state renders nothing; a missing exercise bounces back.
  if (summary === null) return <Navigate to="/more/analytics" replace />
  if (!summary) return <div className="min-h-dvh bg-bg" />

  const unit = weightUnitLabel(unitSystem)
  const latest = summary.sessions.at(-1)

  return (
    <Screen
      title={summary.exerciseName}
      subtitle="Analytics"
      headerAccessory={
        <button
          type="button"
          onClick={() => navigate('/more/analytics')}
          aria-label="Back to analytics"
          className="flex size-9 items-center justify-center rounded-full bg-surface text-content-secondary"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="flex flex-col items-center gap-0.5 py-4">
            <p className="text-[20px] font-bold tabular-nums">
              {Math.round(toDisplayWeight(summary.bestE1rmKg, unitSystem))}
            </p>
            <p className="text-center text-[10px] text-content-tertiary">best e1RM {unit}</p>
          </Card>
          <Card className="flex flex-col items-center gap-0.5 py-4">
            <p className="text-[20px] font-bold tabular-nums">{summary.sessions.length}</p>
            <p className="text-center text-[10px] text-content-tertiary">sessions</p>
          </Card>
          <Card className="flex flex-col items-center gap-0.5 py-4">
            <p className="text-[20px] font-bold tabular-nums">
              {formatCompact(toDisplayWeight(summary.totalVolumeKg, unitSystem))}
            </p>
            <p className="text-center text-[10px] text-content-tertiary">total volume {unit}</p>
          </Card>
        </div>

        <section>
          <SectionHeader title="Estimated 1RM Trend" />
          <Card>
            {chartData.length >= 2 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
                    <defs>
                      <linearGradient id="e1rmFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-blue)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--color-content-tertiary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      domain={['dataMin - 5', 'dataMax + 5']}
                      tick={{ fill: 'var(--color-content-tertiary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ stroke: 'rgb(255 255 255 / 0.15)' }}
                      contentStyle={{
                        background: 'var(--color-surface-raised)',
                        border: '1px solid rgb(255 255 255 / 0.08)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'var(--color-content-secondary)' }}
                      formatter={(value) => [`${value ?? ''} ${unit}`, 'e1RM']}
                    />
                    <Area
                      type="monotone"
                      dataKey="e1rm"
                      stroke="var(--color-blue)"
                      strokeWidth={2.5}
                      fill="url(#e1rmFill)"
                      animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-content-secondary">
                Log this exercise one more time and the trend line will appear.
              </p>
            )}
            {latest ? (
              <p className="mt-2 text-center text-[12px] text-content-tertiary tabular-nums">
                Latest top set: {Math.round(toDisplayWeight(latest.bestWeightKg, unitSystem))}{' '}
                {unit} × {latest.bestReps}
              </p>
            ) : null}
          </Card>
        </section>

        <section>
          <SectionHeader title="History" />
          <Card className="p-0">
            <ul className="divide-y divide-divider">
              {[...summary.sessions].reverse().map((session) => (
                <li
                  key={session.workoutId}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-medium">
                      {formatShortDate(session.completedAt)}
                    </p>
                    <p className="text-[11px] text-content-tertiary tabular-nums">
                      {session.workingSets} working {session.workingSets === 1 ? 'set' : 'sets'} ·{' '}
                      {formatCompact(toDisplayWeight(session.volumeKg, unitSystem))} {unit}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold tabular-nums">
                    {Math.round(toDisplayWeight(session.bestWeightKg, unitSystem))} ×{' '}
                    {session.bestReps}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </Screen>
  )
}
