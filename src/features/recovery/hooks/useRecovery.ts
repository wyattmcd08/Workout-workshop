import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { getAllRecoveryStates } from '@/services/recovery'
import type { MuscleRecoveryState } from '@/types'

/**
 * Live recovery state for every muscle. Reacts to workout completions via
 * Dexie live queries and re-decays fatigue once a minute while mounted.
 */
export function useRecoveryStates(): MuscleRecoveryState[] | undefined {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  return useLiveQuery(() => getAllRecoveryStates(), [tick])
}

/** Overall readiness score: average across all muscles, 0–100. */
export function overallReadiness(states: MuscleRecoveryState[]): number {
  if (states.length === 0) return 100
  return Math.round(states.reduce((sum, s) => sum + s.readiness, 0) / states.length)
}
