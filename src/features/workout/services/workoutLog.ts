import { db } from '@/services/db'
import { applyWorkoutFatigue } from '@/services/recovery'
import type { Workout } from '@/types'

/** Persists a finished workout and updates muscle recovery in one step. */
export async function saveCompletedWorkout(workout: Workout): Promise<void> {
  await db.workouts.add(workout)
  await applyWorkoutFatigue(workout.exercises, workout.completedAt)
}
