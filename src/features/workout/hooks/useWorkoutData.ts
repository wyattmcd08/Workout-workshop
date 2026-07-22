import { useMemo } from 'react'
import { selectAllExercises, useDataStore } from '@/store/dataStore'
import type { Exercise, Workout, WorkoutTemplate } from '@/types'
import { currentStreak } from '@/utils/calculations'
import { dateKeyDaysAgo, todayKey } from '@/utils/date'

export function useRecentWorkouts(limit = 10): Workout[] | undefined {
  const workouts = useDataStore((s) => s.workouts)
  return useMemo(
    () => [...workouts].sort((a, b) => b.startedAt - a.startedAt).slice(0, limit),
    [workouts, limit],
  )
}

export function useTodaysWorkout(): Workout | null | undefined {
  const workouts = useDataStore((s) => s.workouts)
  return useMemo(() => {
    const key = todayKey()
    const todays = workouts.filter((w) => w.dateKey === key)
    return todays.length > 0 ? (todays[todays.length - 1] ?? null) : null
  }, [workouts])
}

export function useTemplates(): WorkoutTemplate[] | undefined {
  const templates = useDataStore((s) => s.templates)
  return useMemo(
    () => [...templates].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)),
    [templates],
  )
}

export function useTrainingStreak(): number | undefined {
  const workouts = useDataStore((s) => s.workouts)
  return useMemo(() => {
    const dateKeys = workouts.map((w) => w.dateKey)
    return currentStreak(dateKeys, todayKey(), dateKeyDaysAgo(1))
  }, [workouts])
}

/** Completed workouts in the trailing 7 days, for the weekly goal ring. */
export function useWorkoutsThisWeek(): number | undefined {
  const workouts = useDataStore((s) => s.workouts)
  return useMemo(() => {
    const since = dateKeyDaysAgo(6)
    return workouts.filter((w) => w.dateKey >= since).length
  }, [workouts])
}

export function useExercises(): Exercise[] | undefined {
  const customExercises = useDataStore((s) => s.customExercises)
  return useMemo(
    () =>
      selectAllExercises({ customExercises })
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customExercises],
  )
}
