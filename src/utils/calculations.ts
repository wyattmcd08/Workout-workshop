import type { WorkoutExercise } from '@/types'

/** Estimated one-rep max using the Epley formula. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

/** Total volume (weight × reps) across completed working sets, in kg. */
export function exerciseVolumeKg(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((total, set) => {
    if (!set.completed || set.type === 'warmup') return total
    return total + (set.weightKg ?? 0) * (set.reps ?? 0)
  }, 0)
}

export function workoutVolumeKg(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, exercise) => total + exerciseVolumeKg(exercise), 0)
}

export function completedSetCount(exercises: WorkoutExercise[]): number {
  return exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((s) => s.completed).length,
    0,
  )
}

/**
 * Consecutive-day training streak ending today or yesterday.
 * Workouts must be sorted by any order; only dateKeys matter.
 */
export function currentStreak(workoutDateKeys: string[], today: string, yesterday: string): number {
  const days = new Set(workoutDateKeys)
  let cursor: string
  if (days.has(today)) cursor = today
  else if (days.has(yesterday)) cursor = yesterday
  else return 0

  let streak = 0
  const date = new Date(`${cursor}T12:00:00`)
  while (days.has(dateKeyOf(date))) {
    streak += 1
    date.setDate(date.getDate() - 1)
  }
  return streak
}

function dateKeyOf(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
