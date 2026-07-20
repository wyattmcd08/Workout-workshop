import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChevronRightIcon,
  MinusIcon,
} from '@heroicons/react/24/solid'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  detectTrends,
  useExerciseSummaries,
  useWeeklyVolume,
  type PlateauFlag,
} from '@/features/analytics/hooks/useAnalytics'
import { useUnitSystem } from '@/store/settingsStore'
import { formatRelativeDay } from '@/utils/date'
import { formatCompact, formatSigned } from '@/utils/format'
import { toDisplayWeight, weightUnitLabel } from '@/utils/units'

const TREND_META = {
  progressing: {
    icon: ArrowTrendingUpIcon,
    color: 'text-accent',
    chip: 'bg-accent-muted text-accent',
    label: 'Progressing',
    advice: 'Keep riding this wave — add small jumps while the bar speed stays good.',
  },
  plateaued: {
    icon: MinusIcon,
    color: 'text-yellow',
    chip: 'bg-yellow/15 text-yellow',
    label: 'Plateaued',
    advice: 'Try a new rep range, add a back-off set, or check sleep and calories.',
  },
  regressing: {
    icon: ArrowTrendingDownIcon,
    color: 'text-red',
    chip: 'bg-red/15 text-red',
    label: 'Regressing',
    advice: 'Strength is trending down — consider a deload week and extra recovery.',
  },
} as const

function TrendCard({ flag }: { flag: PlateauFlag }) {
  const unitSystem = useUnitSystem()
  const meta = TREND_META[flag.status]
  const Icon = meta.icon
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold">{flag.exerciseName}</p>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.chip}`}
        >
          <Icon className="size-3.5" />
          {meta.label}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] text-content-secondary tabular-nums">
        Best e1RM {Math.round(toDisplayWeight(flag.priorBestKg, unitSystem))} →{' '}
        {Math.round(toDisplayWeight(flag.recentBestKg, unitSystem))} {weightUnitLabel(unitSystem)}{' '}
        ({formatSigned(flag.changePercent)}%) over the last 3 weeks
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-content-tertiary">{meta.advice}</p>
    </Card>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const unitSystem = useUnitSystem()
  const summaries = useExerciseSummaries()
  const weeklyVolume = useWeeklyVolume()

  const trends = useMemo(() => (summaries ? detectTrends(summaries) : []), [summaries])
  const chartData = useMemo(
    () =>
      (weeklyVolume ?? []).map((point) => ({
        label: point.label,
        volume: Math.round(toDisplayWeight(point.volumeKg, unitSystem)),
      })),
    [weeklyVolume, unitSystem],
  )

  return (
    <Screen title="Analytics" subtitle="More">
      <div className="flex flex-col gap-6">
        <section>
          <SectionHeader title="Weekly Volume" />
          <Card>
            <p className="mb-3 text-[12px] text-content-secondary">
              Completed working volume · {weightUnitLabel(unitSystem)} per week
            </p>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -18 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--color-content-tertiary)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-content-tertiary)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => formatCompact(value)}
                  />
                  <Bar dataKey="volume" radius={[5, 5, 5, 5]} fill="var(--color-blue)" animationDuration={500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {trends.length > 0 ? (
          <section>
            <SectionHeader title="Progress Watch" />
            <div className="flex flex-col gap-2.5">
              {trends.map((flag) => (
                <TrendCard key={flag.exerciseId} flag={flag} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader title="Exercises" />
          {summaries && summaries.length > 0 ? (
            <Card className="p-0">
              <ul className="divide-y divide-divider">
                {summaries.map((summary) => (
                  <li key={summary.exerciseId}>
                    <button
                      type="button"
                      onClick={() => navigate(`/more/analytics/${summary.exerciseId}`)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">
                          {summary.exerciseName}
                        </p>
                        <p className="mt-0.5 text-[12px] text-content-tertiary">
                          {summary.sessions.length}{' '}
                          {summary.sessions.length === 1 ? 'session' : 'sessions'} · last{' '}
                          {formatRelativeDay(summary.lastTrainedAt).toLowerCase()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-[15px] font-bold tabular-nums">
                            {Math.round(toDisplayWeight(summary.bestE1rmKg, unitSystem))}
                          </p>
                          <p className="text-[10px] text-content-tertiary">
                            e1RM {weightUnitLabel(unitSystem)}
                          </p>
                        </div>
                        <ChevronRightIcon className="size-4 text-content-tertiary" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : summaries ? (
            <Card>
              <EmptyState
                icon={ChartBarIcon}
                title="No training data yet"
                message="Finish a few workouts and your strength trends, volume, and per-exercise analytics will build up here."
              />
            </Card>
          ) : null}
        </section>
      </div>
    </Screen>
  )
}
