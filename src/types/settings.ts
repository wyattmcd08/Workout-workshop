export type UnitSystem = 'metric' | 'imperial'

export interface DailyTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

/** Selectable accent colors for the app's primary color. */
export type AccentColor = 'green' | 'blue' | 'teal' | 'purple' | 'pink' | 'orange'

/** Optional Home dashboard widgets the user can show or hide. */
export interface HomeWidgets {
  /** Streak / readiness / weekly-goal stat row. */
  stats: boolean
  hydration: boolean
  weightTrend: boolean
}

export interface UserProfile {
  name: string
  unitSystem: UnitSystem
  targets: DailyTargets
  /** Workouts per week the user is aiming for. */
  weeklyWorkoutGoal: number
  /** Rest timer length started after completing a set. */
  defaultRestSeconds: number
  /** Primary accent color used across the app. */
  accentColor: AccentColor
  /** Which optional Home dashboard widgets are visible. */
  homeWidgets: HomeWidgets
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
  accentColor: 'green',
  homeWidgets: {
    stats: true,
    hydration: true,
    weightTrend: true,
  },
}
