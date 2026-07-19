export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

export interface MacroBreakdown {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

/** A reusable food saved for quick re-logging. Macros are per serving. */
export interface Food extends MacroBreakdown {
  id: string
  name: string
  servingLabel: string
  isFavorite: boolean
  lastLoggedAt: number
  timesLogged: number
}

/** A single logged food entry. Macros are totals for the logged amount. */
export interface FoodLogEntry extends MacroBreakdown {
  id: string
  dateKey: string
  mealType: MealType
  foodId: string | null
  name: string
  servings: number
  loggedAt: number
}

export interface WaterLogEntry {
  id: string
  dateKey: string
  amountMl: number
  loggedAt: number
}
