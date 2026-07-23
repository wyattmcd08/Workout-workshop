import { useDataStore } from '@/store/dataStore'
import type { MealType, Recipe, ShoppingItem } from '@/types'
import { todayKey } from '@/utils/date'
import { createId } from '@/utils/id'

/**
 * Logs `servings` of a recipe to today's nutrition. Recipe macros are stored
 * per serving, so this scales them and writes a food-log entry that shows up
 * on the Nutrition page immediately — the meal-prep ↔ nutrition tie-in.
 */
export async function logRecipeToToday(
  recipe: Recipe,
  mealType: MealType,
  servings = 1,
): Promise<void> {
  useDataStore.getState().addFoodLog({
    id: createId(),
    dateKey: todayKey(),
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
