import { useEffect, useMemo, useState } from 'react'
import { useDataStore } from '@/store/dataStore'
import { recoveryStatesFromRecords } from '@/services/recovery'
import type { MuscleRecoveryState } from '@/types'

/**
 * Live recovery state for every muscle. Reacts to workout completions via the
 * data store and re-decays fatigue once a minute while mounted.
 */
export function useRecoveryStates(): MuscleRecoveryState[] | undefined {
  const records = useDataStore((s) => s.muscleRecovery)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return useMemo(() => recoveryStatesFromRecords(records, now), [records, now])
}

/** Overall readiness score: average across all muscles, 0–100. */
export function overallReadiness(states: MuscleRecoveryState[]): number {
  if (states.length === 0) return 100
  return Math.round(states.reduce((sum, s) => sum + s.readiness, 0) / states.length)
}
