import { useRef, useState } from 'react'
import {
  CheckCircleIcon,
  PencilSquareIcon,
  ShoppingCartIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useDataStore } from '@/store/dataStore'
import type { MealType, Recipe } from '@/types'
import { MEAL_LABELS, MEAL_TYPES } from '@/types'
import { cn } from '@/utils/cn'
import { addRecipeToShoppingList, logRecipeToToday } from '../services/mealPrepActions'

interface RecipeDetailSheetProps {
  recipe: Recipe | null
  onClose: () => void
  onEdit: (recipe: Recipe) => void
}

const MACROS = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'carbsG', label: 'Carbs' },
  { key: 'fatG', label: 'Fat' },
  { key: 'fiberG', label: 'Fiber' },
] as const

export function RecipeDetailSheet({ recipe, onClose, onEdit }: RecipeDetailSheetProps) {
  const deleteRecipe = useDataStore((s) => s.deleteRecipe)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [logged, setLogged] = useState(false)
  const [addedToList, setAddedToList] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Keep showing the recipe while the sheet plays its close animation.
  const displayRef = useRef<Recipe | null>(recipe)
  if (recipe) displayRef.current = recipe
  const displayRecipe = displayRef.current

  const close = () => {
    setLogged(false)
    setAddedToList(false)
    setConfirmingDelete(false)
    onClose()
  }

  const logMeal = async () => {
    if (!displayRecipe) return
    await logRecipeToToday(displayRecipe, mealType, 1)
    setLogged(true)
  }

  const addToList = async () => {
    if (!displayRecipe) return
    await addRecipeToShoppingList(displayRecipe)
    setAddedToList(true)
  }

  return (
    <Sheet open={recipe !== null} onClose={close} title={displayRecipe?.name ?? ''}>
      {displayRecipe ? (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl bg-surface-sunken p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[24px] font-bold tabular-nums">{Math.round(displayRecipe.calories)}</p>
            <p className="text-[12px] text-content-secondary">
              cal / serving · {displayRecipe.servings}{' '}
              {displayRecipe.servings === 1 ? 'serving' : 'servings'}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {MACROS.map((macro) => (
              <div key={macro.key} className="text-center">
                <p className="text-[15px] font-semibold tabular-nums">
                  {Math.round(displayRecipe[macro.key])}g
                </p>
                <p className="text-[11px] text-content-tertiary">{macro.label}</p>
              </div>
            ))}
          </div>
        </div>

        {displayRecipe.ingredients.length > 0 ? (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-content-secondary">Ingredients</p>
            <ul className="overflow-hidden rounded-2xl bg-surface-sunken">
              {displayRecipe.ingredients.map((ingredient, index) => (
                <li
                  key={ingredient.id}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5 text-[14px]',
                    index > 0 && 'border-t border-divider',
                  )}
                >
                  <span>{ingredient.name}</span>
                  {ingredient.quantity ? (
                    <span className="text-content-tertiary">{ingredient.quantity}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {displayRecipe.instructions.trim() ? (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-content-secondary">Instructions</p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-content">
              {displayRecipe.instructions}
            </p>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-[13px] font-semibold text-content-secondary">Log to nutrition</p>
          <div className="mb-2.5 flex gap-1.5">
            {MEAL_TYPES.map((meal) => (
              <button
                key={meal}
                type="button"
                onClick={() => setMealType(meal)}
                className={cn(
                  'h-9 flex-1 rounded-xl text-[13px] font-semibold transition-colors',
                  meal === mealType
                    ? 'bg-accent text-black'
                    : 'bg-surface-sunken text-content-secondary',
                )}
              >
                {MEAL_LABELS[meal]}
              </button>
            ))}
          </div>
          <Button variant={logged ? 'secondary' : 'primary'} fullWidth onClick={() => void logMeal()}>
            {logged ? (
              <>
                <CheckCircleIcon className="size-5" />
                Logged to {MEAL_LABELS[mealType]}
              </>
            ) : (
              `Log 1 serving to ${MEAL_LABELS[mealType]}`
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button variant="secondary" fullWidth onClick={() => void addToList()}>
            <ShoppingCartIcon className="size-5" />
            {addedToList ? 'Added to shopping list' : 'Add ingredients to shopping list'}
          </Button>
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => onEdit(displayRecipe)}>
              <PencilSquareIcon className="size-4.5" />
              Edit
            </Button>
            {confirmingDelete ? (
              <Button
                variant="destructive"
                fullWidth
                onClick={() => {
                  deleteRecipe(displayRecipe.id)
                  close()
                }}
              >
                Confirm delete
              </Button>
            ) : (
              <Button variant="destructive" fullWidth onClick={() => setConfirmingDelete(true)}>
                <TrashIcon className="size-4.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
      ) : null}
    </Sheet>
  )
}
