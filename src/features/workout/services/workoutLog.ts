import { useDataStore } from '@/store/dataStore'
import type { Workout } from '@/types'

/** Persists a finished workout and updates muscle recovery in one step. */
export async function saveCompletedWorkout(workout: Workout): Promise<void> {
  const store = useDataStore.getState()
  store.addWorkout(workout)
  store.applyWorkoutFatigue(workout.exercises, workout.completedAt)
}
