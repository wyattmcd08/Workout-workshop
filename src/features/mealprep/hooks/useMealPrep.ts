import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import type { Recipe, ShoppingItem } from '@/types'

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
