import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useDataStore } from '@/store/dataStore'
import type { Recipe } from '@/types'
import { createId } from '@/utils/id'

const recipeSchema = z.object({
  name: z.string().trim().min(1, 'Name your recipe'),
  servings: z.number().positive('Must be more than 0'),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  fiberG: z.number().min(0),
  instructions: z.string(),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })),
})

type RecipeFormValues = z.infer<typeof recipeSchema>

const BLANK: RecipeFormValues = {
  name: '',
  servings: 1,
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  instructions: '',
  ingredients: [{ name: '', quantity: '' }],
}

function toFormValues(recipe: Recipe): RecipeFormValues {
  return {
    name: recipe.name,
    servings: recipe.servings,
    calories: recipe.calories,
    proteinG: recipe.proteinG,
    carbsG: recipe.carbsG,
    fatG: recipe.fatG,
    fiberG: recipe.fiberG,
    instructions: recipe.instructions,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity }))
        : [{ name: '', quantity: '' }],
  }
}

interface RecipeEditorSheetProps {
  open: boolean
  onClose: () => void
  /** When set, the sheet edits this recipe instead of creating a new one. */
  recipe?: Recipe | null
}

export function RecipeEditorSheet({ open, onClose, recipe }: RecipeEditorSheetProps) {
  const addRecipe = useDataStore((s) => s.addRecipe)
  const updateRecipe = useDataStore((s) => s.updateRecipe)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({ resolver: zodResolver(recipeSchema), defaultValues: BLANK })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  // Load the target recipe (or a blank form) each time the sheet opens.
  useEffect(() => {
    if (open) reset(recipe ? toFormValues(recipe) : BLANK)
  }, [open, recipe, reset])

  const close = () => {
    onClose()
  }

  const onSubmit = handleSubmit((values) => {
    const ingredients = values.ingredients
      .filter((i) => i.name.trim().length > 0)
      .map((i) => ({ id: createId(), name: i.name.trim(), quantity: i.quantity.trim() }))

    if (recipe) {
      updateRecipe(recipe.id, {
        name: values.name.trim(),
        servings: values.servings,
        calories: values.calories,
        proteinG: values.proteinG,
        carbsG: values.carbsG,
        fatG: values.fatG,
        fiberG: values.fiberG,
        instructions: values.instructions,
        ingredients,
      })
    } else {
      const newRecipe: Recipe = {
        id: createId(),
        name: values.name.trim(),
        servings: values.servings,
        ingredients,
        instructions: values.instructions,
        createdAt: Date.now(),
        calories: values.calories,
        proteinG: values.proteinG,
        carbsG: values.carbsG,
        fatG: values.fatG,
        fiberG: values.fiberG,
      }
      addRecipe(newRecipe)
    }
    close()
  })

  return (
    <Sheet open={open} onClose={close} title={recipe ? 'Edit Recipe' : 'New Recipe'}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <Field
          label="Recipe name"
          placeholder="e.g. Chicken & rice bowl"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <p className="mb-2 text-[13px] font-medium text-content-secondary">Ingredients</p>
          <div className="flex flex-col gap-2">
            {fields.map((fieldItem, index) => (
              <div key={fieldItem.id} className="flex items-center gap-2">
                <input
                  {...register(`ingredients.${index}.name`)}
                  placeholder="Ingredient"
                  aria-label={`Ingredient ${index + 1} name`}
                  className="h-11 min-w-0 flex-[2] rounded-control bg-surface-sunken px-3.5 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
                />
                <input
                  {...register(`ingredients.${index}.quantity`)}
                  placeholder="Qty"
                  aria-label={`Ingredient ${index + 1} quantity`}
                  className="h-11 min-w-0 flex-1 rounded-control bg-surface-sunken px-3.5 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
                />
                <button
                  type="button"
                  aria-label={`Remove ingredient ${index + 1}`}
                  onClick={() => (fields.length > 1 ? remove(index) : undefined)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-content-tertiary disabled:opacity-30"
                  disabled={fields.length <= 1}
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ name: '', quantity: '' })}
            className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-surface-sunken text-[13px] font-semibold text-accent"
          >
            <PlusIcon className="size-4" />
            Add Ingredient
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Servings"
            type="number"
            inputMode="decimal"
            step="1"
            min={1}
            error={errors.servings?.message}
            {...register('servings', { valueAsNumber: true })}
          />
          <Field
            label="Calories / serving"
            type="number"
            inputMode="numeric"
            min={0}
            {...register('calories', { valueAsNumber: true })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Protein"
            type="number"
            inputMode="decimal"
            suffix="g"
            min={0}
            {...register('proteinG', { valueAsNumber: true })}
          />
          <Field
            label="Carbs"
            type="number"
            inputMode="decimal"
            suffix="g"
            min={0}
            {...register('carbsG', { valueAsNumber: true })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Fat"
            type="number"
            inputMode="decimal"
            suffix="g"
            min={0}
            {...register('fatG', { valueAsNumber: true })}
          />
          <Field
            label="Fiber"
            type="number"
            inputMode="decimal"
            suffix="g"
            min={0}
            {...register('fiberG', { valueAsNumber: true })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="recipe-instructions"
            className="text-[13px] font-medium text-content-secondary"
          >
            Instructions
          </label>
          <textarea
            id="recipe-instructions"
            {...register('instructions')}
            rows={4}
            placeholder="Steps, cook time, notes…"
            className="w-full rounded-control bg-surface-sunken px-4 py-3 text-[15px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
        </div>

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {recipe ? 'Save Changes' : 'Save Recipe'}
        </Button>
      </form>
    </Sheet>
  )
}
