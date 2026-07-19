import type {
  MuscleGroup,
  MuscleRecoveryRecord,
  MuscleRecoveryState,
  WorkoutExercise,
} from '@/types'
import { MUSCLE_GROUPS } from '@/types'
import { clamp } from '@/utils/format'
import { hoursBetween } from '@/utils/date'
import { db } from './db'

/** Hours for fatigue to fully drain from 100 → 0. */
const FULL_RECOVERY_HOURS = 72

/** Fatigue added per completed working set that hits a muscle directly. */
const FATIGUE_PER_PRIMARY_SET = 9
/** Secondary muscles accumulate fatigue at a reduced rate. */
const FATIGUE_PER_SECONDARY_SET = 3.5

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

export async function getAllRecoveryStates(now = Date.now()): Promise<MuscleRecoveryState[]> {
  const records = await db.muscleRecovery.toArray()
  const byMuscle = new Map(records.map((r) => [r.muscle, r]))
  return MUSCLE_GROUPS.map((muscle) => {
    const record = byMuscle.get(muscle)
    return record ? toRecoveryState(record, now) : restedState(muscle)
  })
}

/**
 * Applies the fatigue from a completed workout on top of each muscle's
 * current (decayed) fatigue and persists the result.
 */
export async function applyWorkoutFatigue(
  exercises: WorkoutExercise[],
  completedAt: number,
): Promise<void> {
  const addedFatigue = new Map<MuscleGroup, number>()
  const exerciseIds = [...new Set(exercises.map((e) => e.exerciseId))]
  const catalog = await db.exercises.bulkGet(exerciseIds)
  const catalogById = new Map(
    catalog.flatMap((exercise) => (exercise ? [[exercise.id, exercise] as const] : [])),
  )

  for (const performed of exercises) {
    const exercise = catalogById.get(performed.exerciseId)
    if (!exercise) continue
    const workingSets = performed.sets.filter((s) => s.completed && s.type !== 'warmup').length
    if (workingSets === 0) continue

    for (const muscle of exercise.primaryMuscles) {
      addedFatigue.set(
        muscle,
        (addedFatigue.get(muscle) ?? 0) + workingSets * FATIGUE_PER_PRIMARY_SET,
      )
    }
    for (const muscle of exercise.secondaryMuscles) {
      addedFatigue.set(
        muscle,
        (addedFatigue.get(muscle) ?? 0) + workingSets * FATIGUE_PER_SECONDARY_SET,
      )
    }
  }

  if (addedFatigue.size === 0) return

  await db.transaction('rw', db.muscleRecovery, async () => {
    for (const [muscle, added] of addedFatigue) {
      const existing = await db.muscleRecovery.get(muscle)
      const current = existing ? decayedFatigue(existing, completedAt) : 0
      await db.muscleRecovery.put({
        muscle,
        fatigue: clamp(current + added, 0, 100),
        updatedAt: completedAt,
        lastTrainedAt: completedAt,
      })
    }
  })
}
