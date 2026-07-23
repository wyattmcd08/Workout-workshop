export type SetType = 'warmup' | 'working' | 'drop'

export interface WorkoutSet {
  id: string
  type: SetType
  /** Stored in kilograms; converted for display based on unit settings. */
  weightKg: number | null
  reps: number | null
  /** Rate of perceived exertion, 6–10 in 0.5 steps. */
  rpe: number | null
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  /** Denormalized so history renders without joining the exercise table. */
  exerciseName: string
  sets: WorkoutSet[]
  notes: string
  /**
   * Shared id linking consecutive exercises into a superset. Null when the
   * exercise stands alone. Optional for backward compatibility with records
   * saved before supersets existed.
   */
  supersetId?: string | null
}

export interface Workout {
  id: string
  name: string
  /** Local calendar day in YYYY-MM-DD, for day-based queries. */
  dateKey: string
  startedAt: number
  completedAt: number
  durationSeconds: number
  exercises: WorkoutExercise[]
  totalVolumeKg: number
  totalSets: number
}

export interface TemplateExercise {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  exercises: TemplateExercise[]
  createdAt: number
  lastUsedAt: number | null
}
