import type { MuscleGroup } from './muscle'

/**
 * Persisted recovery snapshot for one muscle. Fatigue is 0–100 at
 * `updatedAt`; current fatigue is derived by decaying it over time.
 */
export interface MuscleRecoveryRecord {
  muscle: MuscleGroup
  fatigue: number
  updatedAt: number
  lastTrainedAt: number | null
}

/** Derived, display-ready recovery state for one muscle. */
export interface MuscleRecoveryState {
  muscle: MuscleGroup
  /** 0–100, current after decay. */
  fatigue: number
  /** 0–100, inverse of fatigue. */
  readiness: number
  lastTrainedAt: number | null
  /** Hours until the muscle is fully recovered. */
  hoursToFullRecovery: number
}
