import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import type { MealType } from '@/types'
import { toDateKey } from '@/utils/date'

export interface DayWorkout {
  id: string
  name: string
  totalVolumeKg: number
  totalSets: number
}

export interface DayPlannedMeal {
  mealType: MealType
  recipeName: string
  servings: number
  calories: number
}

/** Everything logged (or planned) for a single calendar day. */
export interface DaySummary {
  workouts: DayWorkout[]
  calories: number
  proteinG: number
  weightKg: number | null
  plannedMeals: DayPlannedMeal[]
}

export interface DayFlags {
  workout: boolean
  nutrition: boolean
  weight: boolean
  plan: boolean
}

function emptySummary(): DaySummary {
  return { workouts: [], calories: 0, proteinG: 0, weightKg: null, plannedMeals: [] }
}

/**
 * Aggregates the whole dataset into a per-day map keyed by YYYY-MM-DD.
 * Reactive — recomputes when any contributing collection changes.
 */
export function useCalendarData(): Map<string, DaySummary> {
  const workouts = useDataStore((s) => s.workouts)
  const foodLogs = useDataStore((s) => s.foodLogs)
  const weightEntries = useDataStore((s) => s.weightEntries)
  const mealPlan = useDataStore((s) => s.mealPlan)
  const recipes = useDataStore((s) => s.recipes)

  return useMemo(() => {
    const map = new Map<string, DaySummary>()
    const ensure = (dateKey: string): DaySummary => {
      let summary = map.get(dateKey)
      if (!summary) {
        summary = emptySummary()
        map.set(dateKey, summary)
      }
      return summary
    }

    for (const workout of workouts) {
      ensure(workout.dateKey).workouts.push({
        id: workout.id,
        name: workout.name,
        totalVolumeKg: workout.totalVolumeKg,
        totalSets: workout.totalSets,
      })
    }
    for (const entry of foodLogs) {
      const day = ensure(entry.dateKey)
      day.calories += entry.calories
      day.proteinG += entry.proteinG
    }
    for (const entry of weightEntries) {
      ensure(entry.dateKey).weightKg = entry.weightKg
    }
    const recipeById = new Map(recipes.map((r) => [r.id, r]))
    for (const entry of mealPlan) {
      const recipe = recipeById.get(entry.recipeId)
      ensure(entry.dateKey).plannedMeals.push({
        mealType: entry.mealType,
        recipeName: recipe?.name ?? 'Removed recipe',
        servings: entry.servings,
        calories: recipe ? recipe.calories * entry.servings : 0,
      })
    }
    return map
  }, [workouts, foodLogs, weightEntries, mealPlan, recipes])
}

export function dayFlags(summary: DaySummary | undefined): DayFlags {
  return {
    workout: (summary?.workouts.length ?? 0) > 0,
    nutrition: (summary?.calories ?? 0) > 0,
    weight: summary?.weightKg != null,
    plan: (summary?.plannedMeals.length ?? 0) > 0,
  }
}

/** Six-week (42-cell) matrix covering `month` (0-indexed), Sunday-first. */
export function buildMonthMatrix(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  const weeks: Date[][] = []
  const cursor = new Date(start)
  for (let week = 0; week < 6; week += 1) {
    const days: Date[] = []
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}

export function dateKeyOf(date: Date): string {
  return toDateKey(date)
}
