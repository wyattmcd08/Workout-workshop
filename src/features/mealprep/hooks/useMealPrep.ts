import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import type { MealPlanEntry, Recipe, ShoppingItem } from '@/types'
import { toDateKey, todayKey } from '@/utils/date'

/** Recipes, newest first. */
export function useRecipes(): Recipe[] {
  const recipes = useDataStore((s) => s.recipes)
  return useMemo(() => [...recipes].sort((a, b) => b.createdAt - a.createdAt), [recipes])
}

export function useRecipe(id: string | null): Recipe | null {
  const recipes = useDataStore((s) => s.recipes)
  return useMemo(() => recipes.find((r) => r.id === id) ?? null, [recipes, id])
}

export interface ShoppingListView {
  unchecked: ShoppingItem[]
  checked: ShoppingItem[]
  hasChecked: boolean
}

/** Shopping list split into outstanding and completed, each oldest-first. */
export function useShoppingList(): ShoppingListView {
  const shoppingList = useDataStore((s) => s.shoppingList)
  return useMemo(() => {
    const byAge = [...shoppingList].sort((a, b) => a.createdAt - b.createdAt)
    const unchecked = byAge.filter((i) => !i.checked)
    const checked = byAge.filter((i) => i.checked)
    return { unchecked, checked, hasChecked: checked.length > 0 }
  }, [shoppingList])
}

/** A planned meal joined to its recipe for rendering. */
export interface PlannedMeal {
  entry: MealPlanEntry
  recipe: Recipe | null
}

export interface PlannedDay {
  dateKey: string
  /** e.g. "Today", "Wed" */
  weekdayLabel: string
  /** e.g. "Jul 22" */
  dateLabel: string
  isToday: boolean
  meals: PlannedMeal[]
  totalCalories: number
}

/** The rolling 7-day plan starting today, meals joined to their recipes. */
export function usePlannedWeek(): PlannedDay[] {
  const mealPlan = useDataStore((s) => s.mealPlan)
  const recipes = useDataStore((s) => s.recipes)

  return useMemo(() => {
    const recipeById = new Map(recipes.map((r) => [r.id, r]))
    const today = todayKey()
    const days: PlannedDay[] = []

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date()
      date.setHours(12, 0, 0, 0)
      date.setDate(date.getDate() + offset)
      const dateKey = toDateKey(date)

      const meals: PlannedMeal[] = mealPlan
        .filter((e) => e.dateKey === dateKey)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((entry) => ({ entry, recipe: recipeById.get(entry.recipeId) ?? null }))

      const totalCalories = meals.reduce(
        (sum, m) => sum + (m.recipe ? m.recipe.calories * m.entry.servings : 0),
        0,
      )

      days.push({
        dateKey,
        weekdayLabel:
          offset === 0
            ? 'Today'
            : date.toLocaleDateString(undefined, { weekday: 'long' }),
        dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        isToday: dateKey === today,
        meals,
        totalCalories,
      })
    }
    return days
  }, [mealPlan, recipes])
}
