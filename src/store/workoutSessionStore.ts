import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate } from '@/types'
import { completedSetCount, workoutVolumeKg } from '@/utils/calculations'
import { toDateKey } from '@/utils/date'
import { createId } from '@/utils/id'

export interface ActiveSession {
  name: string
  startedAt: number
  exercises: WorkoutExercise[]
}

export interface RestTimer {
  endsAt: number
  totalSeconds: number
}

interface WorkoutSessionState {
  session: ActiveSession | null
  restTimer: RestTimer | null
  startRest: (seconds: number) => void
  extendRest: (seconds: number) => void
  clearRest: () => void
  startEmpty: () => void
  startFromTemplate: (template: WorkoutTemplate) => void
  addExercise: (exercise: Exercise) => void
  removeExercise: (workoutExerciseId: string) => void
  addSet: (workoutExerciseId: string) => void
  removeSet: (workoutExerciseId: string, setId: string) => void
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<Omit<WorkoutSet, 'id'>>,
  ) => void
  setExerciseNotes: (workoutExerciseId: string, notes: string) => void
  /** Builds the immutable Workout record and clears the session. */
  finish: () => Workout | null
  cancel: () => void
}

function emptySet(previous?: WorkoutSet): WorkoutSet {
  return {
    id: createId(),
    type: 'working',
    weightKg: previous?.weightKg ?? null,
    reps: previous?.reps ?? null,
    rpe: null,
    completed: false,
  }
}

function sessionExercise(exerciseId: string, exerciseName: string, setCount = 3): WorkoutExercise {
  return {
    id: createId(),
    exerciseId,
    exerciseName,
    sets: Array.from({ length: setCount }, () => emptySet()),
    notes: '',
  }
}

function updateExercise(
  exercises: WorkoutExercise[],
  workoutExerciseId: string,
  update: (exercise: WorkoutExercise) => WorkoutExercise,
): WorkoutExercise[] {
  return exercises.map((exercise) =>
    exercise.id === workoutExerciseId ? update(exercise) : exercise,
  )
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      session: null,
      restTimer: null,

      startRest: (seconds) =>
        set({ restTimer: { endsAt: Date.now() + seconds * 1000, totalSeconds: seconds } }),

      extendRest: (seconds) =>
        set((state) => {
          if (!state.restTimer) return state
          return {
            restTimer: {
              endsAt: state.restTimer.endsAt + seconds * 1000,
              totalSeconds: state.restTimer.totalSeconds + seconds,
            },
          }
        }),

      clearRest: () => set({ restTimer: null }),

      startEmpty: () =>
        set({ session: { name: 'Workout', startedAt: Date.now(), exercises: [] } }),

      startFromTemplate: (template) =>
        set({
          session: {
            name: template.name,
            startedAt: Date.now(),
            exercises: template.exercises.map((entry) =>
              sessionExercise(entry.exerciseId, entry.exerciseName, entry.targetSets),
            ),
          },
        }),

      addExercise: (exercise) =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              exercises: [...state.session.exercises, sessionExercise(exercise.id, exercise.name)],
            },
          }
        }),

      removeExercise: (workoutExerciseId) =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              exercises: state.session.exercises.filter((e) => e.id !== workoutExerciseId),
            },
          }
        }),

      addSet: (workoutExerciseId) =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              exercises: updateExercise(state.session.exercises, workoutExerciseId, (exercise) => ({
                ...exercise,
                sets: [...exercise.sets, emptySet(exercise.sets.at(-1))],
              })),
            },
          }
        }),

      removeSet: (workoutExerciseId, setId) =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              exercises: updateExercise(state.session.exercises, workoutExerciseId, (exercise) => ({
                ...exercise,
                sets: exercise.sets.filter((s) => s.id !== setId),
              })),
            },
          }
        }),

      updateSet: (workoutExerciseId, setId, patch) =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              exercises: updateExercise(state.session.exercises, workoutExerciseId, (exercise) => ({
                ...exercise,
                sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
              })),
            },
          }
        }),

      setExerciseNotes: (workoutExerciseId, notes) =>
        set((state) => {
          if (!state.session) return state
          return {
            session: {
              ...state.session,
              exercises: updateExercise(state.session.exercises, workoutExerciseId, (exercise) => ({
                ...exercise,
                notes,
              })),
            },
          }
        }),

      finish: () => {
        const { session } = get()
        if (!session) return null

        const exercises = session.exercises
          .map((exercise) => ({
            ...exercise,
            sets: exercise.sets.filter((s) => s.completed),
          }))
          .filter((exercise) => exercise.sets.length > 0)

        if (exercises.length === 0) {
          set({ session: null, restTimer: null })
          return null
        }

        const completedAt = Date.now()
        const workout: Workout = {
          id: createId(),
          name: session.name,
          dateKey: toDateKey(new Date(session.startedAt)),
          startedAt: session.startedAt,
          completedAt,
          durationSeconds: Math.round((completedAt - session.startedAt) / 1000),
          exercises,
          totalVolumeKg: workoutVolumeKg(exercises),
          totalSets: completedSetCount(exercises),
        }
        set({ session: null, restTimer: null })
        return workout
      },

      cancel: () => set({ session: null, restTimer: null }),
    }),
    { name: 'dialed-dawg-active-workout' },
  ),
)
