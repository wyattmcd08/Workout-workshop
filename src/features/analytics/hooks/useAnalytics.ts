import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import type { Workout } from '@/types'
import { estimateOneRepMax, exerciseVolumeKg } from '@/utils/calculations'
import { parseDateKey } from '@/utils/date'

/** One training session's contribution to an exercise's history. */
export interface ExerciseSession {
  workoutId: string
  dateKey: string
  completedAt: number
  bestE1rmKg: number
  bestWeightKg: number
  bestReps: number
  volumeKg: number
  workingSets: number
}

export interface ExerciseSummary {
  exerciseId: string
  exerciseName: string
  sessions: ExerciseSession[]
  bestE1rmKg: number
  lastTrainedAt: number
  totalVolumeKg: number
}

export type TrendStatus = 'progressing' | 'plateaued' | 'regressing'

export interface PlateauFlag {
  exerciseId: string
  exerciseName: string
  status: TrendStatus
  recentBestKg: number
  priorBestKg: number
  /** Percentage change of recent best e1RM vs the prior window. */
  changePercent: number
}

const WINDOW_DAYS = 21
const DAY_MS = 86_400_000

function sessionFromWorkout(workout: Workout, exerciseId: string): ExerciseSession | null {
  let best: { e1rm: number; weightKg: number; reps: number } | null = null
  let volume = 0
  let workingSets = 0

  for (const exercise of workout.exercises) {
    if (exercise.exerciseId !== exerciseId) continue
    volume += exerciseVolumeKg(exercise)
    for (const set of exercise.sets) {
      if (!set.completed || set.type === 'warmup') continue
      workingSets += 1
      if (set.weightKg === null || set.reps === null || set.reps === 0) continue
      const e1rm = estimateOneRepMax(set.weightKg, set.reps)
      if (!best || e1rm > best.e1rm) best = { e1rm, weightKg: set.weightKg, reps: set.reps }
    }
  }

  if (workingSets === 0) return null
  return {
    workoutId: workout.id,
    dateKey: workout.dateKey,
    completedAt: workout.completedAt,
    bestE1rmKg: best?.e1rm ?? 0,
    bestWeightKg: best?.weightKg ?? 0,
    bestReps: best?.reps ?? 0,
    volumeKg: volume,
    workingSets,
  }
}

function buildSummaries(workouts: Workout[]): Map<string, ExerciseSummary> {
  const summaries = new Map<string, ExerciseSummary>()
  const exerciseIds = new Set(
    workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)),
  )

  for (const exerciseId of exerciseIds) {
    const sessions: ExerciseSession[] = []
    let exerciseName = ''
    for (const workout of workouts) {
      const owner = workout.exercises.find((e) => e.exerciseId === exerciseId)
      if (!owner) continue
      exerciseName = owner.exerciseName
      const session = sessionFromWorkout(workout, exerciseId)
      if (session) sessions.push(session)
    }
    if (sessions.length === 0) continue
    sessions.sort((a, b) => a.completedAt - b.completedAt)
    summaries.set(exerciseId, {
      exerciseId,
      exerciseName,
      sessions,
      bestE1rmKg: Math.max(...sessions.map((s) => s.bestE1rmKg)),
      lastTrainedAt: sessions.at(-1)?.completedAt ?? 0,
      totalVolumeKg: sessions.reduce((sum, s) => sum + s.volumeKg, 0),
    })
  }
  return summaries
}

/** All exercises with logged history, most recently trained first. */
export function useExerciseSummaries(): ExerciseSummary[] | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.toArray()
    return [...buildSummaries(workouts).values()].sort(
      (a, b) => b.lastTrainedAt - a.lastTrainedAt,
    )
  }, [])
}

export function useExerciseSummary(exerciseId: string): ExerciseSummary | null | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.toArray()
    return buildSummaries(workouts).get(exerciseId) ?? null
  }, [exerciseId])
}

/**
 * Rule-based progressive-overload check: compares the best e1RM in the last
 * 21 days against the 21 days before that. Only lifts with enough history
 * in both windows are judged.
 */
export function detectTrends(summaries: ExerciseSummary[], now = Date.now()): PlateauFlag[] {
  const flags: PlateauFlag[] = []
  const recentStart = now - WINDOW_DAYS * DAY_MS
  const priorStart = now - 2 * WINDOW_DAYS * DAY_MS

  for (const summary of summaries) {
    const recent = summary.sessions.filter((s) => s.completedAt >= recentStart)
    const prior = summary.sessions.filter(
      (s) => s.completedAt >= priorStart && s.completedAt < recentStart,
    )
    if (recent.length < 2 || prior.length < 2) continue

    const recentBest = Math.max(...recent.map((s) => s.bestE1rmKg))
    const priorBest = Math.max(...prior.map((s) => s.bestE1rmKg))
    if (priorBest <= 0) continue

    const changePercent = ((recentBest - priorBest) / priorBest) * 100
    const status: TrendStatus =
      changePercent > 1 ? 'progressing' : changePercent < -2 ? 'regressing' : 'plateaued'

    flags.push({
      exerciseId: summary.exerciseId,
      exerciseName: summary.exerciseName,
      status,
      recentBestKg: recentBest,
      priorBestKg: priorBest,
      changePercent,
    })
  }

  // Surface problems first, biggest regression on top.
  return flags.sort((a, b) => a.changePercent - b.changePercent)
}

export interface WeeklyVolumePoint {
  label: string
  volumeKg: number
}

/** Total completed working volume per week (Monday-anchored, last 8 weeks). */
export function useWeeklyVolume(): WeeklyVolumePoint[] | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.toArray()
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    const points: WeeklyVolumePoint[] = []
    for (let i = 7; i >= 0; i -= 1) {
      const start = new Date(monday)
      start.setDate(monday.getDate() - i * 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      const volumeKg = workouts.reduce((sum, w) => {
        const d = parseDateKey(w.dateKey)
        return d >= start && d < end ? sum + w.totalVolumeKg : sum
      }, 0)
      points.push({
        label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        volumeKg,
      })
    }
    return points
  }, [])
}
