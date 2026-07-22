import type {
  Exercise,
  MuscleGroup,
  MuscleRecoveryRecord,
  MuscleRecoveryState,
  WorkoutExercise,
} from '@/types'
import { MUSCLE_GROUPS } from '@/types'
import { clamp } from '@/utils/format'
import { hoursBetween } from '@/utils/date'

/**
 * Recovery math. Pure functions only — no storage. The data store owns the
 * persisted records; these helpers derive display state and compute the
 * fatigue a finished workout adds.
 */

/** Hours for fatigue to fully drain from 100 → 0. */
export const FULL_RECOVERY_HOURS = 72

/** Fatigue added per completed working set that hits a muscle directly. */
const FATIGUE_PER_PRIMARY_SET = 9
/** Secondary muscles accumulate fatigue at a reduced rate. */
const FATIGUE_PER_SECONDARY_SET = 3.5

/** Persisted recovery records, keyed by muscle. */
export type MuscleRecoveryMap = Partial<Record<MuscleGroup, MuscleRecoveryRecord>>

/** Decay stored fatigue linearly based on time elapsed. */
function decayedFatigue(record: MuscleRecoveryRecord, now: number): number {
  const elapsed = hoursBetween(record.updatedAt, now)
  const drained = (elapsed / FULL_RECOVERY_HOURS) * 100
  return clamp(record.fatigue - drained, 0, 100)
}

export function toRecoveryState(record: MuscleRecoveryRecord, now: number): MuscleRecoveryState {
  const fatigue = decayedFatigue(record, now)
  return {
    muscle: record.muscle,
    fatigue,
    readiness: 100 - fatigue,
    lastTrainedAt: record.lastTrainedAt,
    hoursToFullRecovery: (fatigue / 100) * FULL_RECOVERY_HOURS,
  }
}

/** Fresh, fully-recovered state for muscles with no stored record. */
function restedState(muscle: MuscleGroup): MuscleRecoveryState {
  return { muscle, fatigue: 0, readiness: 100, lastTrainedAt: null, hoursToFullRecovery: 0 }
}

/** Display-ready recovery state for every muscle, decayed to `now`. */
export function recoveryStatesFromRecords(
  records: MuscleRecoveryMap,
  now = Date.now(),
): MuscleRecoveryState[] {
  return MUSCLE_GROUPS.map((muscle) => {
    const record = records[muscle]
    return record ? toRecoveryState(record, now) : restedState(muscle)
  })
}

/**
 * Returns the new recovery map after applying a completed workout's fatigue
 * on top of each muscle's current (decayed) fatigue. Pure — the caller
 * persists the result.
 */
export function computeWorkoutFatigue(
  current: MuscleRecoveryMap,
  exercisesById: Map<string, Exercise>,
  performed: WorkoutExercise[],
  completedAt: number,
): MuscleRecoveryMap {
  const added = new Map<MuscleGroup, number>()

  for (const exercise of performed) {
    const catalog = exercisesById.get(exercise.exerciseId)
    if (!catalog) continue
    const workingSets = exercise.sets.filter((s) => s.completed && s.type !== 'warmup').length
    if (workingSets === 0) continue

    for (const muscle of catalog.primaryMuscles) {
      added.set(muscle, (added.get(muscle) ?? 0) + workingSets * FATIGUE_PER_PRIMARY_SET)
    }
    for (const muscle of catalog.secondaryMuscles) {
      added.set(muscle, (added.get(muscle) ?? 0) + workingSets * FATIGUE_PER_SECONDARY_SET)
    }
  }

  if (added.size === 0) return current

  const next: MuscleRecoveryMap = { ...current }
  for (const [muscle, addedFatigue] of added) {
    const existing = current[muscle]
    const base = existing ? decayedFatigue(existing, completedAt) : 0
    next[muscle] = {
      muscle,
      fatigue: clamp(base + addedFatigue, 0, 100),
      updatedAt: completedAt,
      lastTrainedAt: completedAt,
    }
  }
  return next
}
