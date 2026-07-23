import { useDataStore } from '@/store/dataStore'
import type { MealPlanEntry, MealType, Recipe, ShoppingItem } from '@/types'
import { todayKey } from '@/utils/date'
import { createId } from '@/utils/id'

/**
 * Logs `servings` of a recipe to a specific day's nutrition. Recipe macros
 * are stored per serving, so this scales them and writes a food-log entry
 * that shows up on the Nutrition page — the meal-prep ↔ nutrition tie-in.
 */
export async function logRecipeToDay(
  recipe: Recipe,
  dateKey: string,
  mealType: MealType,
  servings = 1,
): Promise<void> {
  useDataStore.getState().addFoodLog({
    id: createId(),
    dateKey,
    mealType,
    foodId: null,
    name: recipe.name,
    servings,
    calories: recipe.calories * servings,
    proteinG: recipe.proteinG * servings,
    carbsG: recipe.carbsG * servings,
    fatG: recipe.fatG * servings,
    fiberG: recipe.fiberG * servings,
    loggedAt: Date.now(),
  })
}

/** Logs a recipe to today's nutrition. */
export async function logRecipeToToday(
  recipe: Recipe,
  mealType: MealType,
  servings = 1,
): Promise<void> {
  await logRecipeToDay(recipe, todayKey(), mealType, servings)
}

/** Adds a recipe to a day/meal slot in the weekly plan. */
export async function planRecipe(
  recipeId: string,
  dateKey: string,
  mealType: MealType,
  servings = 1,
): Promise<void> {
  const entry: MealPlanEntry = {
    id: createId(),
    dateKey,
    mealType,
    recipeId,
    servings,
    createdAt: Date.now(),
  }
  useDataStore.getState().addMealPlanEntry(entry)
}

/**
 * Adds every ingredient used across the given recipes to the shopping list,
 * de-duplicated by name (case-insensitive) and skipping items already on the
 * list. Returns how many new items were added.
 */
export async function generateShoppingFromRecipes(recipes: Recipe[]): Promise<number> {
  const store = useDataStore.getState()
  const existing = new Set(store.shoppingList.map((i) => i.name.trim().toLowerCase()))
  const seen = new Set<string>()
  const now = Date.now()
  const items: ShoppingItem[] = []

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const name = ingredient.name.trim()
      const key = name.toLowerCase()
      if (!name || existing.has(key) || seen.has(key)) continue
      seen.add(key)
      items.push({
        id: createId(),
        name,
        quantity: ingredient.quantity.trim(),
        checked: false,
        source: 'recipe',
        createdAt: now + items.length,
      })
    }
  }

  if (items.length > 0) store.addShoppingItems(items)
  return items.length
}

/** Adds every ingredient of a recipe to the shopping list. */
export async function addRecipeToShoppingList(recipe: Recipe): Promise<void> {
  const now = Date.now()
  const items: ShoppingItem[] = recipe.ingredients
    .filter((ingredient) => ingredient.name.trim().length > 0)
    .map((ingredient, index) => ({
      id: createId(),
      name: ingredient.name.trim(),
      quantity: ingredient.quantity.trim(),
      checked: false,
      source: 'recipe',
      // Preserve recipe order without colliding timestamps.
      createdAt: now + index,
    }))
  if (items.length > 0) useDataStore.getState().addShoppingItems(items)
}

export async function addManualShoppingItem(name: string, quantity: string): Promise<void> {
  useDataStore.getState().addShoppingItems([
    {
      id: createId(),
      name: name.trim(),
      quantity: quantity.trim(),
      checked: false,
      source: 'manual',
      createdAt: Date.now(),
    },
  ])
}
