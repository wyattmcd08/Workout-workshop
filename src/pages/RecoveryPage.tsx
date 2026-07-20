import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BodyMap } from '@/features/recovery/components/BodyMap'
import { readinessTierColor } from '@/features/recovery/utils/colors'
import { overallReadiness, useRecoveryStates } from '@/features/recovery/hooks/useRecovery'
import type { MuscleGroup, MuscleRecoveryState, MuscleRegion } from '@/types'
import { MUSCLE_LABELS, MUSCLE_REGIONS } from '@/types'
import { formatRelativeDay } from '@/utils/date'

const REGION_ORDER: Array<{ region: MuscleRegion; label: string }> = [
  { region: 'upper', label: 'Upper Body' },
  { region: 'core', label: 'Core' },
  { region: 'lower', label: 'Lower Body' },
]

function readinessSummary(score: number): string {
  if (score >= 85) return 'Fully recovered. Great day to push heavy.'
  if (score >= 65) return 'Mostly recovered. Train hard, mind the sore spots.'
  if (score >= 40) return 'Carrying fatigue. Favor fresh muscle groups today.'
  return 'Deep fatigue. Prioritize rest, sleep, and light movement.'
}

function recoveryEta(state: MuscleRecoveryState): string {
  if (state.hoursToFullRecovery < 1) return 'Fully recovered'
  if (state.hoursToFullRecovery < 24) {
    return `~${Math.ceil(state.hoursToFullRecovery)}h to full recovery`
  }
  const days = state.hoursToFullRecovery / 24
  return `~${days.toFixed(days < 2 ? 1 : 0)}d to full recovery`
}

function MuscleRow({ state }: { state: MuscleRecoveryState }) {
  const readiness = Math.round(state.readiness)
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-28 shrink-0">
        <p className="text-[14px] font-medium">{MUSCLE_LABELS[state.muscle]}</p>
        <p className="text-[11px] text-content-tertiary">
          {state.lastTrainedAt ? formatRelativeDay(state.lastTrainedAt) : 'Not trained yet'}
        </p>
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${readiness}%`, backgroundColor: readinessTierColor(readiness) }}
        />
      </div>
      <span className="w-10 text-right text-[13px] font-semibold tabular-nums">{readiness}%</span>
    </div>
  )
}

export default function RecoveryPage() {
  const states = useRecoveryStates()
  const [selected, setSelected] = useState<MuscleGroup | null>(null)
  const score = states ? overallReadiness(states) : 100

  const selectedState = useMemo(
    () => states?.find((s) => s.muscle === selected) ?? null,
    [states, selected],
  )

  const grouped = useMemo(() => {
    const byRegion = new Map<MuscleRegion, MuscleRecoveryState[]>()
    for (const state of states ?? []) {
      const region = MUSCLE_REGIONS[state.muscle]
      const list = byRegion.get(region) ?? []
      list.push(state)
      byRegion.set(region, list)
    }
    for (const list of byRegion.values()) {
      list.sort((a, b) => a.readiness - b.readiness)
    }
    return byRegion
  }, [states])

  return (
    <Screen title="Recovery">
      <div className="flex flex-col gap-6">
        <Card className="flex items-center gap-5 p-5">
          <ProgressRing
            progress={score / 100}
            size={96}
            strokeWidth={9}
            color={readinessTierColor(score)}
          >
            <div className="text-center">
              <p className="text-[24px] leading-none font-bold tabular-nums">{score}</p>
              <p className="mt-0.5 text-[10px] font-medium text-content-secondary">readiness</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-[16px] font-semibold">Body Readiness</p>
            <p className="mt-1 text-[13px] leading-relaxed text-content-secondary">
              {readinessSummary(score)}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          {states ? (
            <BodyMap
              states={states}
              selected={selected}
              onSelect={(muscle) => setSelected(muscle === selected ? null : muscle)}
            />
          ) : null}
          <AnimatePresence>
            {selectedState ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl bg-surface-sunken p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold">
                      {MUSCLE_LABELS[selectedState.muscle]}
                    </p>
                    <span
                      className="text-[15px] font-bold tabular-nums"
                      style={{ color: readinessTierColor(selectedState.readiness) }}
                    >
                      {Math.round(selectedState.readiness)}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(selectedState.readiness)}%`,
                        backgroundColor: readinessTierColor(selectedState.readiness),
                      }}
                    />
                  </div>
                  <div className="mt-2.5 flex justify-between text-[12px] text-content-secondary">
                    <span>
                      {selectedState.lastTrainedAt
                        ? `Last trained ${formatRelativeDay(selectedState.lastTrainedAt).toLowerCase()}`
                        : 'Not trained yet'}
                    </span>
                    <span>{recoveryEta(selectedState)}</span>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>

        {REGION_ORDER.map(({ region, label }) => {
          const list = grouped.get(region)
          if (!list || list.length === 0) return null
          return (
            <section key={region}>
              <SectionHeader title={label} />
              <Card className="divide-y divide-divider py-1.5">
                {list.map((state) => (
                  <MuscleRow key={state.muscle} state={state} />
                ))}
              </Card>
            </section>
          )
        })}

        <p className="px-2 text-center text-[12px] leading-relaxed text-content-tertiary">
          Fatigue is estimated from your completed working sets and recovers over 72 hours.
          Finishing a workout updates every muscle it touched.
        </p>
      </div>
    </Screen>
  )
}
