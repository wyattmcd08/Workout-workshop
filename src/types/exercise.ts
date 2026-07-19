import type { MuscleGroup } from './muscle'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other'

export type MovementPattern =
  | 'horizontal-push'
  | 'vertical-push'
  | 'horizontal-pull'
  | 'vertical-pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'carry'
  | 'isolation'
  | 'core'

export interface Exercise {
  id: string
  name: string
  equipment: Equipment
  pattern: MovementPattern
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  /** True when created by the user rather than shipped with the app. */
  isCustom: boolean
}
