import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import type { Food, FoodLogEntry, MacroBreakdown, MealType } from '@/types'
import { todayKey } from '@/utils/date'

export interface TodayNutrition {
  entries: FoodLogEntry[]
  entriesByMeal: Record<MealType, FoodLogEntry[]>
  totals: MacroBreakdown
  waterMl: number
}

const EMPTY_TOTALS: MacroBreakdown = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }

export function useTodayNutrition(): TodayNutrition | undefined {
  return useLiveQuery(async () => {
    const dateKey = todayKey()
    const [entries, waterEntries] = await Promise.all([
      db.foodLogs.where('dateKey').equals(dateKey).sortBy('loggedAt'),
      db.waterLogs.where('dateKey').equals(dateKey).toArray(),
    ])

    const entriesByMeal: Record<MealType, FoodLogEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    const totals = { ...EMPTY_TOTALS }
    for (const entry of entries) {
      entriesByMeal[entry.mealType].push(entry)
      totals.calories += entry.calories
      totals.proteinG += entry.proteinG
      totals.carbsG += entry.carbsG
      totals.fatG += entry.fatG
      totals.fiberG += entry.fiberG
    }

    return {
      entries,
      entriesByMeal,
      totals,
      waterMl: waterEntries.reduce((sum, w) => sum + w.amountMl, 0),
    }
  }, [])
}

/** Most recently logged foods for one-tap re-logging. */
export function useRecentFoods(limit = 8): Food[] | undefined {
  return useLiveQuery(
    () => db.foods.orderBy('lastLoggedAt').reverse().limit(limit).toArray(),
    [limit],
  )
}
