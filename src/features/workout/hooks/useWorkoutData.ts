import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import type { Exercise, Workout, WorkoutTemplate } from '@/types'
import { currentStreak } from '@/utils/calculations'
import { dateKeyDaysAgo, todayKey } from '@/utils/date'

export function useRecentWorkouts(limit = 10): Workout[] | undefined {
  return useLiveQuery(
    () => db.workouts.orderBy('startedAt').reverse().limit(limit).toArray(),
    [limit],
  )
}

export function useTodaysWorkout(): Workout | null | undefined {
  return useLiveQuery(async () => {
    const workout = await db.workouts.where('dateKey').equals(todayKey()).last()
    return workout ?? null
  }, [])
}

export function useTemplates(): WorkoutTemplate[] | undefined {
  return useLiveQuery(() => db.templates.orderBy('lastUsedAt').reverse().toArray(), [])
}

export function useTrainingStreak(): number | undefined {
  return useLiveQuery(async () => {
    const dateKeys = (await db.workouts.orderBy('dateKey').uniqueKeys()) as string[]
    return currentStreak(dateKeys, todayKey(), dateKeyDaysAgo(1))
  }, [])
}

/** Completed workouts in the trailing 7 days, for the weekly goal ring. */
export function useWorkoutsThisWeek(): number | undefined {
  return useLiveQuery(async () => {
    const since = dateKeyDaysAgo(6)
    return db.workouts.where('dateKey').aboveOrEqual(since).count()
  }, [])
}

export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])
}
