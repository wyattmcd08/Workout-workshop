import { db } from '@/services/db'
import type { TemplateExercise, Workout, WorkoutTemplate } from '@/types'
import { createId } from '@/utils/id'

/** Most common value in a list; falls back when the list is empty. */
function mode(values: number[], fallback: number): number {
  if (values.length === 0) return fallback
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let best = values[0] as number
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

/** Turns a completed workout into a reusable template. */
export async function createTemplateFromWorkout(workout: Workout): Promise<WorkoutTemplate> {
  const exercises: TemplateExercise[] = workout.exercises.map((exercise) => {
    const workingSets = exercise.sets.filter((s) => s.type !== 'warmup')
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      targetSets: Math.max(1, workingSets.length),
      targetReps: mode(
        workingSets.flatMap((s) => (s.reps !== null && s.reps > 0 ? [s.reps] : [])),
        8,
      ),
    }
  })

  const template: WorkoutTemplate = {
    id: createId(),
    name: workout.name === 'Workout' ? `Workout ${workout.dateKey}` : workout.name,
    exercises,
    createdAt: Date.now(),
    lastUsedAt: null,
  }
  await db.templates.add(template)
  return template
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await db.templates.delete(templateId)
}

export async function touchTemplate(templateId: string): Promise<void> {
  await db.templates.update(templateId, { lastUsedAt: Date.now() })
}
