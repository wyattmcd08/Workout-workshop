import Dexie, { type Table } from 'dexie'
import type {
  Exercise,
  Food,
  FoodLogEntry,
  MuscleGroup,
  MuscleRecoveryRecord,
  WaterLogEntry,
  WeightEntry,
  Workout,
  WorkoutTemplate,
} from '@/types'
import { SEED_EXERCISES } from './seed/exercises'

class DialedDawgDatabase extends Dexie {
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  templates!: Table<WorkoutTemplate, string>
  foods!: Table<Food, string>
  foodLogs!: Table<FoodLogEntry, string>
  waterLogs!: Table<WaterLogEntry, string>
  weightEntries!: Table<WeightEntry, string>
  muscleRecovery!: Table<MuscleRecoveryRecord, MuscleGroup>

  constructor() {
    super('dialed-dawg')
    this.version(1).stores({
      exercises: 'id, name, *primaryMuscles',
      workouts: 'id, dateKey, startedAt',
      templates: 'id, name, lastUsedAt',
      foods: 'id, name, lastLoggedAt, timesLogged',
      foodLogs: 'id, dateKey, loggedAt',
      waterLogs: 'id, dateKey',
      weightEntries: 'id, dateKey, loggedAt',
      muscleRecovery: 'muscle',
    })

    this.on('populate', () => {
      void this.exercises.bulkAdd(SEED_EXERCISES)
    })
  }
}

export const db = new DialedDawgDatabase()

/**
 * Adds any built-in exercises introduced after the user's database was
 * created. Never overwrites rows, so user edits and custom entries survive.
 */
export async function syncSeedExercises(): Promise<void> {
  const existingIds = new Set(await db.exercises.toCollection().primaryKeys())
  const missing = SEED_EXERCISES.filter((exercise) => !existingIds.has(exercise.id))
  if (missing.length > 0) {
    await db.exercises.bulkAdd(missing)
  }
}
