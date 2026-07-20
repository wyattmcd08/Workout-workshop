import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { estimateOneRepMax } from '@/utils/calculations'

export interface ExercisePR {
  exerciseId: string
  exerciseName: string
  /** Best estimated one-rep max across all history, in kg. */
  bestE1rmKg: number
  /** The set that produced it. */
  bestWeightKg: number
  bestReps: number
  achievedAt: number
}

export const FEATURED_LIFTS = [
  { exerciseId: 'barbell-bench-press', shortName: 'Bench' },
  { exerciseId: 'barbell-back-squat', shortName: 'Squat' },
  { exerciseId: 'deadlift', shortName: 'Deadlift' },
] as const

/**
 * All-time PRs per exercise, computed from completed working sets across
 * every workout. Reactive — updates the moment a workout is saved.
 */
export function useExercisePRs(): Map<string, ExercisePR> | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.toArray()
    const prs = new Map<string, ExercisePR>()

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (!set.completed || set.type === 'warmup') continue
          if (set.weightKg === null || set.reps === null || set.reps === 0) continue
          const e1rm = estimateOneRepMax(set.weightKg, set.reps)
          const current = prs.get(exercise.exerciseId)
          if (!current || e1rm > current.bestE1rmKg) {
            prs.set(exercise.exerciseId, {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              bestE1rmKg: e1rm,
              bestWeightKg: set.weightKg,
              bestReps: set.reps,
              achievedAt: workout.completedAt,
            })
          }
        }
      }
    }
    return prs
  }, [])
}
