import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CheckIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PlanMealSheet } from '@/features/mealprep/components/PlanMealSheet'
import { RecipeDetailSheet } from '@/features/mealprep/components/RecipeDetailSheet'
import { RecipeEditorSheet } from '@/features/mealprep/components/RecipeEditorSheet'
import {
  useRecipes,
  useShoppingList,
  usePlannedWeek,
  type PlannedDay,
} from '@/features/mealprep/hooks/useMealPrep'
import {
  addManualShoppingItem,
  generateShoppingFromRecipes,
  logRecipeToDay,
} from '@/features/mealprep/services/mealPrepActions'
import { useDataStore } from '@/store/dataStore'
import { MEAL_LABELS, type Recipe } from '@/types'
import { cn } from '@/utils/cn'

type Tab = 'recipes' | 'plan' | 'shopping'

const TABS = [
  { value: 'recipes', label: 'Recipes' },
  { value: 'plan', label: 'Plan' },
  { value: 'shopping', label: 'Shopping' },
] as const

function RecipesTab() {
  const recipes = useRecipes()
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  const openNew = () => {
    setEditingRecipe(null)
    setEditorOpen(true)
  }

  const openEdit = (recipe: Recipe) => {
    setDetailRecipe(null)
    setEditingRecipe(recipe)
    setEditorOpen(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" fullWidth onClick={openNew}>
        <PlusIcon className="size-5" />
        New Recipe
      </Button>

      {recipes.length > 0 ? (
        recipes.map((recipe) => (
          <Card key={recipe.id} onPress={() => setDetailRecipe(recipe)}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{recipe.name}</p>
                <p className="mt-0.5 text-[12px] text-content-secondary">
                  {Math.round(recipe.calories)} cal · {Math.round(recipe.proteinG)}g protein ·{' '}
                  {recipe.ingredients.length}{' '}
                  {recipe.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
                </p>
              </div>
              <span className="shrink-0 text-[12px] font-semibold text-content-tertiary">
                per serving
              </span>
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <EmptyState
            icon={BookOpenIcon}
            title="No recipes yet"
            message="Build your first recipe with ingredients and macros. You can log it to nutrition or push its ingredients to your shopping list."
            action={
              <Button size="sm" onClick={openNew}>
                Create a recipe
              </Button>
            }
          />
        </Card>
      )}

      <RecipeDetailSheet
        recipe={detailRecipe}
        onClose={() => setDetailRecipe(null)}
        onEdit={openEdit}
      />
      <RecipeEditorSheet
        open={editorOpen}
        recipe={editingRecipe}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}

function ShoppingTab() {
  const { unchecked, checked, hasChecked } = useShoppingList()
  const toggleShoppingItem = useDataStore((s) => s.toggleShoppingItem)
  const deleteShoppingItem = useDataStore((s) => s.deleteShoppingItem)
  const clearCheckedShopping = useDataStore((s) => s.clearCheckedShopping)

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')

  const submit = () => {
    if (!name.trim()) return
    void addManualShoppingItem(name, quantity)
    setName('')
    setQuantity('')
  }

  const isEmpty = unchecked.length === 0 && checked.length === 0

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Add an item"
            aria-label="Item name"
            className="h-11 min-w-0 flex-[2] rounded-control bg-surface-sunken px-3.5 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Qty"
            aria-label="Item quantity"
            className="h-11 min-w-0 flex-1 rounded-control bg-surface-sunken px-3.5 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Add item"
            className="flex size-11 shrink-0 items-center justify-center rounded-control bg-accent text-black"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
      </Card>

      {isEmpty ? (
        <Card>
          <EmptyState
            icon={ShoppingCartIcon}
            title="Your list is empty"
            message="Add items above, or open a recipe and push its ingredients straight to the list."
          />
        </Card>
      ) : (
        <Card className="p-0">
          <ul>
            <AnimatePresence initial={false}>
              {unchecked.map((item, index) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    index > 0 && 'border-t border-divider',
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Check off ${item.name}`}
                    onClick={() => toggleShoppingItem(item.id)}
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-content-tertiary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px]">{item.name}</p>
                    {item.quantity ? (
                      <p className="text-[12px] text-content-tertiary">{item.quantity}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => deleteShoppingItem(item.id)}
                    className="shrink-0 text-content-tertiary"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>

            {checked.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 border-t border-divider px-4 py-3"
              >
                <button
                  type="button"
                  aria-label={`Uncheck ${item.name}`}
                  onClick={() => toggleShoppingItem(item.id)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-black"
                >
                  <CheckIcon className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-content-tertiary line-through">
                    {item.name}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => deleteShoppingItem(item.id)}
                  className="shrink-0 text-content-tertiary"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {hasChecked ? (
        <Button variant="secondary" fullWidth onClick={clearCheckedShopping}>
          Clear checked items
        </Button>
      ) : null}
    </div>
  )
}

function PlanDayCard({
  day,
  onAddMeal,
  loggedIds,
  onLog,
}: {
  day: PlannedDay
  onAddMeal: (day: PlannedDay) => void
  loggedIds: Set<string>
  onLog: (day: PlannedDay, meal: PlannedDay['meals'][number]) => void
}) {
  const deleteMealPlanEntry = useDataStore((s) => s.deleteMealPlanEntry)

  return (
    <Card>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <p className={cn('text-[15px] font-semibold', day.isToday && 'text-accent')}>
            {day.weekdayLabel}
          </p>
          <p className="text-[12px] text-content-tertiary">{day.dateLabel}</p>
        </div>
        {day.totalCalories > 0 ? (
          <p className="text-[12px] font-semibold text-content-secondary tabular-nums">
            {Math.round(day.totalCalories)} cal
          </p>
        ) : null}
      </div>

      {day.meals.length > 0 ? (
        <ul className="mb-2 flex flex-col gap-1.5">
          {day.meals.map((meal) => {
            const logged = loggedIds.has(meal.entry.id)
            return (
              <li
                key={meal.entry.id}
                className="flex items-center gap-2 rounded-xl bg-surface-sunken px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">
                    {meal.recipe?.name ?? 'Removed recipe'}
                  </p>
                  <p className="text-[11px] text-content-tertiary">
                    {MEAL_LABELS[meal.entry.mealType]}
                    {meal.entry.servings !== 1 ? ` · ${meal.entry.servings}×` : ''}
                    {meal.recipe
                      ? ` · ${Math.round(meal.recipe.calories * meal.entry.servings)} cal`
                      : ''}
                  </p>
                </div>
                {meal.recipe ? (
                  <button
                    type="button"
                    onClick={() => onLog(day, meal)}
                    disabled={logged}
                    className={cn(
                      'shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-semibold',
                      logged ? 'text-content-tertiary' : 'bg-accent-muted text-accent',
                    )}
                  >
                    {logged ? 'Logged' : 'Log'}
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Remove ${meal.recipe?.name ?? 'meal'} from ${day.weekdayLabel}`}
                  onClick={() => deleteMealPlanEntry(meal.entry.id)}
                  className="shrink-0 text-content-tertiary"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mb-2 text-[13px] text-content-tertiary">No meals planned</p>
      )}

      <button
        type="button"
        onClick={() => onAddMeal(day)}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-surface-sunken text-[13px] font-semibold text-accent"
      >
        <PlusIcon className="size-4" />
        Add meal
      </button>
    </Card>
  )
}

function PlanTab() {
  const week = usePlannedWeek()
  const recipes = useRecipes()
  const [planningDay, setPlanningDay] = useState<PlannedDay | null>(null)
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set())
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)

  const plannedRecipeIds = new Set(week.flatMap((d) => d.meals.map((m) => m.entry.recipeId)))
  const hasPlan = plannedRecipeIds.size > 0

  const logMeal = (day: PlannedDay, meal: PlannedDay['meals'][number]) => {
    if (!meal.recipe) return
    void logRecipeToDay(meal.recipe, day.dateKey, meal.entry.mealType, meal.entry.servings)
    setLoggedIds((prev) => new Set(prev).add(meal.entry.id))
  }

  const generate = async () => {
    const planned = recipes.filter((r) => plannedRecipeIds.has(r.id))
    const added = await generateShoppingFromRecipes(planned)
    setGeneratedCount(added)
  }

  return (
    <div className="flex flex-col gap-3">
      {recipes.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDaysIcon}
            title="Plan your week"
            message="Create a few recipes first, then assign them to days to build your meal plan and a shopping list."
          />
        </Card>
      ) : (
        <>
          {week.map((day) => (
            <PlanDayCard
              key={day.dateKey}
              day={day}
              onAddMeal={setPlanningDay}
              loggedIds={loggedIds}
              onLog={logMeal}
            />
          ))}

          {hasPlan ? (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" fullWidth onClick={() => void generate()}>
                <ShoppingCartIcon className="size-5" />
                Generate shopping list from plan
              </Button>
              {generatedCount !== null ? (
                <p className="text-center text-[12px] text-content-secondary">
                  {generatedCount > 0
                    ? `Added ${generatedCount} new ${generatedCount === 1 ? 'item' : 'items'} to your shopping list.`
                    : 'Everything from your plan is already on the list.'}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <PlanMealSheet
        dateKey={planningDay?.dateKey ?? null}
        dayLabel={planningDay ? `${planningDay.weekdayLabel} ${planningDay.dateLabel}` : ''}
        onClose={() => setPlanningDay(null)}
      />
    </div>
  )
}

export default function MealPrepPage() {
  const [tab, setTab] = useState<Tab>('recipes')

  return (
    <Screen title="Meal Prep" subtitle="More">
      <div className="mb-5">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} layoutId="mealprep-tab" />
      </div>
      {tab === 'recipes' ? <RecipesTab /> : tab === 'plan' ? <PlanTab /> : <ShoppingTab />}
    </Screen>
  )
}
