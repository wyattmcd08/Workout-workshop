import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
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
  const foodLogs = useDataStore((s) => s.foodLogs)
  const waterLogs = useDataStore((s) => s.waterLogs)

  return useMemo(() => {
    const dateKey = todayKey()
    const entries = foodLogs
      .filter((e) => e.dateKey === dateKey)
      .sort((a, b) => a.loggedAt - b.loggedAt)

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

    const waterMl = waterLogs
      .filter((w) => w.dateKey === dateKey)
      .reduce((sum, w) => sum + w.amountMl, 0)

    return { entries, entriesByMeal, totals, waterMl }
  }, [foodLogs, waterLogs])
}

/** Most recently logged foods for one-tap re-logging. */
export function useRecentFoods(limit = 8): Food[] | undefined {
  const foods = useDataStore((s) => s.foods)
  return useMemo(
    () => [...foods].sort((a, b) => b.lastLoggedAt - a.lastLoggedAt).slice(0, limit),
    [foods, limit],
  )
}
