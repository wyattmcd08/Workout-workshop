import type { MacroBreakdown } from './nutrition'

export interface RecipeIngredient {
  id: string
  name: string
  /** Free-form amount, e.g. "200 g", "2 cups", "1 clove". */
  quantity: string
}

/**
 * A saved recipe. Macros extend {@link MacroBreakdown} and are stored
 * **per serving**, so logging one serving to nutrition is a direct copy.
 */
export interface Recipe extends MacroBreakdown {
  id: string
  name: string
  servings: number
  ingredients: RecipeIngredient[]
  instructions: string
  createdAt: number
}

export type ShoppingItemSource = 'manual' | 'recipe'

export interface ShoppingItem {
  id: string
  name: string
  quantity: string
  checked: boolean
  source: ShoppingItemSource
  createdAt: number
}
