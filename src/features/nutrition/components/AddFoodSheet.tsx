import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import type { Food, MealType } from '@/types'
import { MEAL_LABELS, MEAL_TYPES } from '@/types'
import { cn } from '@/utils/cn'
import { useRecentFoods } from '../hooks/useTodayNutrition'
import { logNewFood, relogFood } from '../services/nutritionLog'

const foodSchema = z.object({
  name: z.string().trim().min(1, 'Give this food a name'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number().positive('Must be more than 0'),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  fiberG: z.number().min(0),
})

type FoodFormValues = z.infer<typeof foodSchema>

interface AddFoodSheetProps {
  open: boolean
  onClose: () => void
  defaultMealType: MealType
}

export function AddFoodSheet({ open, onClose, defaultMealType }: AddFoodSheetProps) {
  const recentFoods = useRecentFoods()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: '',
      mealType: defaultMealType,
      servings: 1,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    },
  })
  const mealType = watch('mealType')

  // The sheet stays mounted between opens; re-point the meal picker at the
  // section the user tapped each time it opens.
  useEffect(() => {
    if (open) setValue('mealType', defaultMealType)
  }, [open, defaultMealType, setValue])

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    await logNewFood(values)
    close()
  })

  const quickLog = async (food: Food) => {
    await relogFood(food, mealType)
    close()
  }

  return (
    <Sheet open={open} onClose={close} title="Log Food">
      <div className="mb-4 flex gap-1.5">
        {MEAL_TYPES.map((meal) => (
          <button
            key={meal}
            type="button"
            onClick={() => setValue('mealType', meal)}
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

      {recentFoods && recentFoods.length > 0 ? (
        <div className="mb-5">
          <p className="mb-2 text-[13px] font-medium text-content-secondary">Recent</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {recentFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => void quickLog(food)}
                className="shrink-0 rounded-xl bg-surface-sunken px-3.5 py-2.5 text-left"
              >
                <p className="max-w-36 truncate text-[13px] font-semibold">{food.name}</p>
                <p className="text-[11px] text-content-tertiary">
                  {Math.round(food.calories)} cal
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3.5">
        <Field
          label="Food name"
          placeholder="e.g. Chicken & rice bowl"
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Calories"
            type="number"
            inputMode="numeric"
            min={0}
            error={errors.calories?.message}
            {...register('calories', { valueAsNumber: true })}
          />
          <Field
            label="Servings"
            type="number"
            inputMode="decimal"
            step="0.25"
            min={0.25}
            error={errors.servings?.message}
            {...register('servings', { valueAsNumber: true })}
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
        <Button type="submit" size="lg" fullWidth disabled={isSubmitting} className="mt-2">
          Log to {MEAL_LABELS[mealType]}
        </Button>
      </form>
    </Sheet>
  )
}
