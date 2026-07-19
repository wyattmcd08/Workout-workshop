import { db } from '@/services/db'
import type { Food, FoodLogEntry, MacroBreakdown, MealType } from '@/types'
import { todayKey } from '@/utils/date'
import { createId } from '@/utils/id'

export interface NewFoodLogInput extends MacroBreakdown {
  name: string
  mealType: MealType
  servings: number
}

/**
 * Logs a manually entered food. The food is also saved to the library
 * (deduplicated by name) so it appears under Recents for one-tap re-logging.
 */
export async function logNewFood(input: NewFoodLogInput): Promise<void> {
  const now = Date.now()
  const perServing: MacroBreakdown = {
    calories: input.calories / input.servings,
    proteinG: input.proteinG / input.servings,
    carbsG: input.carbsG / input.servings,
    fatG: input.fatG / input.servings,
    fiberG: input.fiberG / input.servings,
  }

  await db.transaction('rw', db.foods, db.foodLogs, async () => {
    const existing = await db.foods.where('name').equalsIgnoreCase(input.name).first()
    let foodId: string
    if (existing) {
      foodId = existing.id
      await db.foods.update(existing.id, {
        ...perServing,
        lastLoggedAt: now,
        timesLogged: existing.timesLogged + 1,
      })
    } else {
      foodId = createId()
      const food: Food = {
        id: foodId,
        name: input.name,
        servingLabel: '1 serving',
        isFavorite: false,
        lastLoggedAt: now,
        timesLogged: 1,
        ...perServing,
      }
      await db.foods.add(food)
    }

    const entry: FoodLogEntry = {
      id: createId(),
      dateKey: todayKey(),
      mealType: input.mealType,
      foodId,
      name: input.name,
      servings: input.servings,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      fiberG: input.fiberG,
      loggedAt: now,
    }
    await db.foodLogs.add(entry)
  })
}

/** One-tap re-log of a saved food at one serving. */
export async function relogFood(food: Food, mealType: MealType): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.foods, db.foodLogs, async () => {
    await db.foods.update(food.id, { lastLoggedAt: now, timesLogged: food.timesLogged + 1 })
    await db.foodLogs.add({
      id: createId(),
      dateKey: todayKey(),
      mealType,
      foodId: food.id,
      name: food.name,
      servings: 1,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      fiberG: food.fiberG,
      loggedAt: now,
    })
  })
}

export async function deleteFoodLogEntry(entryId: string): Promise<void> {
  await db.foodLogs.delete(entryId)
}

export async function logWater(amountMl: number): Promise<void> {
  await db.waterLogs.add({
    id: createId(),
    dateKey: todayKey(),
    amountMl,
    loggedAt: Date.now(),
  })
}
