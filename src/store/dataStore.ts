import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Exercise,
  Food,
  FoodLogEntry,
  MealPlanEntry,
  Peptide,
  PeptideDoseLog,
  Recipe,
  ShoppingItem,
  WaterLogEntry,
  WeightEntry,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
} from '@/types'
import { SEED_EXERCISES } from '@/services/seed/exercises'
import { computeWorkoutFatigue, type MuscleRecoveryMap } from '@/services/recovery'
import { createId } from '@/utils/id'

/**
 * The single source of truth for all user data, persisted to localStorage
 * via Zustand. This replaces the previous IndexedDB/Dexie layer: localStorage
 * is synchronous and has no connection/cursor lifecycle, so it never hits the
 * WebKit "Unable to open cursor" failure that broke the installed iOS PWA.
 *
 * Seed exercises are NOT persisted — they are static and re-derived from code
 * on every load, which keeps the persisted payload small. Only user-generated
 * data (workouts, logs, templates, custom exercises, recovery) is stored.
 */
export interface DataSnapshot {
  workouts: Workout[]
  templates: WorkoutTemplate[]
  foods: Food[]
  foodLogs: FoodLogEntry[]
  waterLogs: WaterLogEntry[]
  weightEntries: WeightEntry[]
  muscleRecovery: MuscleRecoveryMap
  customExercises: Exercise[]
  recipes: Recipe[]
  shoppingList: ShoppingItem[]
  mealPlan: MealPlanEntry[]
  peptides: Peptide[]
  peptideLogs: PeptideDoseLog[]
}

/** Shape accepted from a legacy IndexedDB read or an exported bundle. */
export interface LegacyImport {
  workouts?: unknown[]
  templates?: unknown[]
  foods?: unknown[]
  foodLogs?: unknown[]
  waterLogs?: unknown[]
  weightEntries?: unknown[]
  muscleRecovery?: unknown[]
  exercises?: unknown[]
}

interface DataActions {
  addWorkout: (workout: Workout) => void
  applyWorkoutFatigue: (exercises: WorkoutExercise[], completedAt: number) => void

  addCustomExercise: (exercise: Exercise) => void
  deleteCustomExercise: (id: string) => void

  addTemplate: (template: WorkoutTemplate) => void
  updateTemplate: (id: string, patch: Partial<WorkoutTemplate>) => void
  deleteTemplate: (id: string) => void

  addFood: (food: Food) => void
  updateFood: (id: string, patch: Partial<Food>) => void
  addFoodLog: (entry: FoodLogEntry) => void
  deleteFoodLog: (id: string) => void

  addWaterLog: (entry: WaterLogEntry) => void
  upsertWeightForDay: (dateKey: string, weightKg: number) => void

  addRecipe: (recipe: Recipe) => void
  updateRecipe: (id: string, patch: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void

  addShoppingItems: (items: ShoppingItem[]) => void
  toggleShoppingItem: (id: string) => void
  deleteShoppingItem: (id: string) => void
  clearCheckedShopping: () => void

  addMealPlanEntry: (entry: MealPlanEntry) => void
  deleteMealPlanEntry: (id: string) => void

  addPeptide: (peptide: Peptide) => void
  updatePeptide: (id: string, patch: Partial<Peptide>) => void
  deletePeptide: (id: string) => void
  /** Log a dose for today and decrement the peptide's inventory. */
  logPeptideDose: (id: string, dateKey: string) => void
  deletePeptideLog: (id: string) => void

  /** Replace the entire dataset (used by import). */
  replaceAll: (snapshot: Partial<DataSnapshot>) => void
  /** Fill only currently-empty collections from a legacy source (migration). */
  mergeLegacy: (legacy: LegacyImport) => void
}

type DataState = DataSnapshot & DataActions

const EMPTY: DataSnapshot = {
  workouts: [],
  templates: [],
  foods: [],
  foodLogs: [],
  waterLogs: [],
  weightEntries: [],
  muscleRecovery: {},
  customExercises: [],
  recipes: [],
  shoppingList: [],
  mealPlan: [],
  peptides: [],
  peptideLogs: [],
}

/** All exercises: static seed plus any user-created ones. */
export function selectAllExercises(state: Pick<DataSnapshot, 'customExercises'>): Exercise[] {
  return state.customExercises.length > 0
    ? [...SEED_EXERCISES, ...state.customExercises]
    : SEED_EXERCISES
}

/**
 * localStorage wrapper that never throws. A failed write (e.g. private-mode
 * quota) degrades to in-memory state instead of crashing the app.
 */
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* ignore quota / disabled storage */
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}))

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...EMPTY,

      addWorkout: (workout) => set((s) => ({ workouts: [...s.workouts, workout] })),

      applyWorkoutFatigue: (exercises, completedAt) =>
        set((s) => ({
          muscleRecovery: computeWorkoutFatigue(
            s.muscleRecovery,
            new Map(selectAllExercises(s).map((e) => [e.id, e])),
            exercises,
            completedAt,
          ),
        })),

      addCustomExercise: (exercise) =>
        set((s) => ({ customExercises: [...s.customExercises, exercise] })),
      deleteCustomExercise: (id) =>
        set((s) => ({ customExercises: s.customExercises.filter((e) => e.id !== id) })),

      addTemplate: (template) => set((s) => ({ templates: [...s.templates, template] })),
      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addFood: (food) => set((s) => ({ foods: [...s.foods, food] })),
      updateFood: (id, patch) =>
        set((s) => ({ foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      addFoodLog: (entry) => set((s) => ({ foodLogs: [...s.foodLogs, entry] })),
      deleteFoodLog: (id) => set((s) => ({ foodLogs: s.foodLogs.filter((e) => e.id !== id) })),

      addWaterLog: (entry) => set((s) => ({ waterLogs: [...s.waterLogs, entry] })),

      upsertWeightForDay: (dateKey, weightKg) =>
        set((s) => {
          const now = Date.now()
          const index = s.weightEntries.findIndex((e) => e.dateKey === dateKey)
          if (index >= 0) {
            const next = s.weightEntries.slice()
            next[index] = { ...next[index]!, weightKg, loggedAt: now }
            return { weightEntries: next }
          }
          return {
            weightEntries: [
              ...s.weightEntries,
              { id: createId(), dateKey, weightKg, loggedAt: now },
            ],
          }
        }),

      addRecipe: (recipe) => set((s) => ({ recipes: [...s.recipes, recipe] })),
      updateRecipe: (id, patch) =>
        set((s) => ({ recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRecipe: (id) => set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),

      addShoppingItems: (items) =>
        set((s) => ({ shoppingList: [...s.shoppingList, ...items] })),
      toggleShoppingItem: (id) =>
        set((s) => ({
          shoppingList: s.shoppingList.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        })),
      deleteShoppingItem: (id) =>
        set((s) => ({ shoppingList: s.shoppingList.filter((item) => item.id !== id) })),
      clearCheckedShopping: () =>
        set((s) => ({ shoppingList: s.shoppingList.filter((item) => !item.checked) })),

      addMealPlanEntry: (entry) => set((s) => ({ mealPlan: [...s.mealPlan, entry] })),
      deleteMealPlanEntry: (id) =>
        set((s) => ({ mealPlan: s.mealPlan.filter((e) => e.id !== id) })),

      addPeptide: (peptide) => set((s) => ({ peptides: [...s.peptides, peptide] })),
      updatePeptide: (id, patch) =>
        set((s) => ({ peptides: s.peptides.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePeptide: (id) =>
        set((s) => ({
          peptides: s.peptides.filter((p) => p.id !== id),
          peptideLogs: s.peptideLogs.filter((l) => l.peptideId !== id),
        })),
      logPeptideDose: (id, dateKey) =>
        set((s) => {
          const peptide = s.peptides.find((p) => p.id === id)
          if (!peptide) return s
          return {
            peptideLogs: [
              ...s.peptideLogs,
              {
                id: createId(),
                peptideId: id,
                dateKey,
                doseMcg: peptide.doseMcg,
                loggedAt: Date.now(),
              },
            ],
            peptides: s.peptides.map((p) =>
              p.id === id ? { ...p, inventoryMcg: Math.max(0, p.inventoryMcg - p.doseMcg) } : p,
            ),
          }
        }),
      deletePeptideLog: (id) =>
        set((s) => {
          const log = s.peptideLogs.find((l) => l.id === id)
          if (!log) return s
          // Return the dose to inventory so deleting a mistaken log is lossless.
          return {
            peptideLogs: s.peptideLogs.filter((l) => l.id !== id),
            peptides: s.peptides.map((p) =>
              p.id === log.peptideId ? { ...p, inventoryMcg: p.inventoryMcg + log.doseMcg } : p,
            ),
          }
        }),

      replaceAll: (snapshot) => set(() => ({ ...EMPTY, ...snapshot })),

      mergeLegacy: (legacy) =>
        set((s) => {
          const patch: Partial<DataSnapshot> = {}
          const fillArray = <K extends keyof DataSnapshot>(key: K, rows: unknown[] | undefined) => {
            if ((s[key] as unknown[]).length === 0 && Array.isArray(rows) && rows.length > 0) {
              patch[key] = rows as DataSnapshot[K]
            }
          }
          fillArray('workouts', legacy.workouts)
          fillArray('templates', legacy.templates)
          fillArray('foods', legacy.foods)
          fillArray('foodLogs', legacy.foodLogs)
          fillArray('waterLogs', legacy.waterLogs)
          fillArray('weightEntries', legacy.weightEntries)

          if (
            Object.keys(s.muscleRecovery).length === 0 &&
            Array.isArray(legacy.muscleRecovery) &&
            legacy.muscleRecovery.length > 0
          ) {
            const map: MuscleRecoveryMap = {}
            for (const raw of legacy.muscleRecovery) {
              const record = raw as { muscle?: keyof MuscleRecoveryMap }
              if (record?.muscle) map[record.muscle] = raw as never
            }
            patch.muscleRecovery = map
          }

          if (s.customExercises.length === 0 && Array.isArray(legacy.exercises)) {
            const custom = legacy.exercises.filter(
              (e): e is Exercise => (e as Exercise)?.isCustom === true,
            )
            if (custom.length > 0) patch.customExercises = custom
          }
          return patch
        }),
    }),
    {
      name: 'dialed-dawg-data',
      version: 1,
      storage: safeStorage,
      partialize: (state): DataSnapshot => ({
        workouts: state.workouts,
        templates: state.templates,
        foods: state.foods,
        foodLogs: state.foodLogs,
        waterLogs: state.waterLogs,
        weightEntries: state.weightEntries,
        muscleRecovery: state.muscleRecovery,
        customExercises: state.customExercises,
        recipes: state.recipes,
        shoppingList: state.shoppingList,
        mealPlan: state.mealPlan,
        peptides: state.peptides,
        peptideLogs: state.peptideLogs,
      }),
    },
  ),
)

/** Read the current dataset without subscribing (for exports/services). */
export function snapshotData(): DataSnapshot {
  const s = useDataStore.getState()
  return {
    workouts: s.workouts,
    templates: s.templates,
    foods: s.foods,
    foodLogs: s.foodLogs,
    waterLogs: s.waterLogs,
    weightEntries: s.weightEntries,
    muscleRecovery: s.muscleRecovery,
    customExercises: s.customExercises,
    recipes: s.recipes,
    shoppingList: s.shoppingList,
    mealPlan: s.mealPlan,
    peptides: s.peptides,
    peptideLogs: s.peptideLogs,
  }
}
