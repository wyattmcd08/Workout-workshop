import { useState } from 'react'
import { FireIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { AddFoodSheet } from '@/features/nutrition/components/AddFoodSheet'
import { MacroRings } from '@/features/nutrition/components/MacroRings'
import { useTodayNutrition } from '@/features/nutrition/hooks/useTodayNutrition'
import { deleteFoodLogEntry, logWater } from '@/features/nutrition/services/nutritionLog'
import { useDailyTargets } from '@/store/settingsStore'
import type { MealType } from '@/types'
import { MEAL_LABELS, MEAL_TYPES } from '@/types'

export default function NutritionPage() {
  const nutrition = useTodayNutrition()
  const targets = useDailyTargets()
  const [sheetMeal, setSheetMeal] = useState<MealType | null>(null)

  const totals = nutrition?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  const remaining = Math.max(0, targets.calories - totals.calories)

  return (
    <Screen title="Nutrition" subtitle="Today">
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-5">
            <ProgressRing
              progress={targets.calories > 0 ? totals.calories / targets.calories : 0}
              size={112}
              strokeWidth={10}
              color="var(--color-orange)"
            >
              <div className="text-center">
                <p className="text-[24px] leading-none font-bold tabular-nums">
                  {Math.round(remaining).toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] font-medium text-content-secondary">
                  cal left
                </p>
              </div>
            </ProgressRing>
            <div className="flex-1 text-[13px] text-content-secondary">
              <p>
                <span className="font-semibold text-content tabular-nums">
                  {Math.round(totals.calories).toLocaleString()}
                </span>{' '}
                eaten
              </p>
              <p className="mt-1">
                <span className="font-semibold text-content tabular-nums">
                  {targets.calories.toLocaleString()}
                </span>{' '}
                daily target
              </p>
              <p className="mt-1">
                <span className="font-semibold text-content tabular-nums">
                  {Math.round(totals.fiberG)}g
                </span>{' '}
                fiber
              </p>
            </div>
          </div>
          <MacroRings totals={totals} targets={targets} />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold">Water</p>
              <p className="mt-0.5 text-[12px] text-content-secondary">
                {((nutrition?.waterMl ?? 0) / 1000).toFixed(1)} of{' '}
                {(targets.waterMl / 1000).toFixed(1)} L
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => void logWater(250)}>
                +250 ml
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void logWater(500)}>
                +500 ml
              </Button>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{
                width: `${Math.min(100, ((nutrition?.waterMl ?? 0) / targets.waterMl) * 100)}%`,
              }}
            />
          </div>
        </Card>

        <section>
          <SectionHeader title="Meals" />
          {nutrition && nutrition.entries.length === 0 ? (
            <Card>
              <EmptyState
                icon={FireIcon}
                title="Nothing logged today"
                message="Log your first meal to start tracking calories and macros."
                action={
                  <Button size="sm" onClick={() => setSheetMeal('breakfast')}>
                    Log food
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {MEAL_TYPES.map((meal) => {
                const entries = nutrition?.entriesByMeal[meal] ?? []
                const mealCalories = entries.reduce((sum, e) => sum + e.calories, 0)
                return (
                  <Card key={meal}>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-semibold">{MEAL_LABELS[meal]}</p>
                      <div className="flex items-center gap-3">
                        {entries.length > 0 ? (
                          <span className="text-[13px] font-medium text-content-secondary tabular-nums">
                            {Math.round(mealCalories)} cal
                          </span>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`Add food to ${MEAL_LABELS[meal]}`}
                          onClick={() => setSheetMeal(meal)}
                          className="flex size-8 items-center justify-center rounded-full bg-accent-muted text-accent"
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                    {entries.length > 0 ? (
                      <ul className="mt-2 divide-y divide-divider">
                        {entries.map((entry) => (
                          <li key={entry.id} className="flex items-center justify-between py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-medium">{entry.name}</p>
                              <p className="text-[11px] text-content-tertiary tabular-nums">
                                P {Math.round(entry.proteinG)} · C {Math.round(entry.carbsG)} · F{' '}
                                {Math.round(entry.fatG)}
                                {entry.servings !== 1 ? ` · ${entry.servings}× serving` : ''}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2.5 pl-3">
                              <span className="text-[13px] font-semibold tabular-nums">
                                {Math.round(entry.calories)}
                              </span>
                              <button
                                type="button"
                                aria-label={`Delete ${entry.name}`}
                                onClick={() => void deleteFoodLogEntry(entry.id)}
                                className="text-content-tertiary"
                              >
                                <TrashIcon className="size-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <AddFoodSheet
        open={sheetMeal !== null}
        onClose={() => setSheetMeal(null)}
        defaultMealType={sheetMeal ?? 'breakfast'}
      />
    </Screen>
  )
}
