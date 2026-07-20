export type UnitSystem = 'metric' | 'imperial'

export interface DailyTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

export interface UserProfile {
  name: string
  unitSystem: UnitSystem
  targets: DailyTargets
  /** Workouts per week the user is aiming for. */
  weeklyWorkoutGoal: number
  /** Rest timer length started after completing a set. */
  defaultRestSeconds: number
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  unitSystem: 'imperial',
  targets: {
    calories: 2400,
    proteinG: 180,
    carbsG: 250,
    fatG: 75,
    waterMl: 3000,
  },
  weeklyWorkoutGoal: 4,
  defaultRestSeconds: 120,
}
