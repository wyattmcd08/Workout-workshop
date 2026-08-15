import { snapshotData } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { recoveryStatesFromRecords } from '@/services/recovery'
import { estimateOneRepMax } from '@/utils/calculations'
import { MUSCLE_LABELS } from '@/types'
import { dateKeyDaysAgo, formatShortDate, todayKey } from '@/utils/date'
import { toDisplayWeight, weightUnitLabel } from '@/utils/units'

const FEATURED_LIFTS = ['barbell-bench-press', 'barbell-back-squat', 'deadlift']

/**
 * Compiles a compact, plain-text summary of the user's fitness data for the
 * AI Coach. Kept concise so it fits comfortably in the prompt. Reads the
 * stores directly (not a hook) so it can run at send time.
 */
export function buildCoachContext(): string {
  const data = snapshotData()
  const { profile } = useSettingsStore.getState()
  const unit = profile.unitSystem
  const u = weightUnitLabel(unit)
  const displayW = (kg: number) => Math.round(toDisplayWeight(kg, unit) * 10) / 10
  const lines: string[] = []

  const t = profile.targets
  lines.push(
    `Units: ${unit === 'metric' ? 'kg' : 'lb'}. Daily targets: ${t.calories} kcal, ${t.proteinG}g protein, ${t.carbsG}g carbs, ${t.fatG}g fat, ${(t.waterMl / 1000).toFixed(1)}L water. Weekly workout goal: ${profile.weeklyWorkoutGoal}.`,
  )

  // Today's nutrition
  const today = todayKey()
  const todayLogs = data.foodLogs.filter((e) => e.dateKey === today)
  const cals = todayLogs.reduce((s, e) => s + e.calories, 0)
  const protein = todayLogs.reduce((s, e) => s + e.proteinG, 0)
  const water = data.waterLogs
    .filter((w) => w.dateKey === today)
    .reduce((s, w) => s + w.amountMl, 0)
  lines.push(
    `Today so far: ${Math.round(cals)} kcal (${Math.round(t.calories - cals)} remaining), ${Math.round(protein)}g protein, ${(water / 1000).toFixed(1)}L water.`,
  )

  // Recovery
  const states = recoveryStatesFromRecords(data.muscleRecovery)
  const readiness =
    states.length > 0
      ? Math.round(states.reduce((s, x) => s + x.readiness, 0) / states.length)
      : 100
  const fatigued = [...states]
    .sort((a, b) => a.readiness - b.readiness)
    .filter((s) => s.readiness < 80)
    .slice(0, 3)
  lines.push(
    `Overall recovery readiness: ${readiness}/100.` +
      (fatigued.length > 0
        ? ` Most fatigued: ${fatigued.map((s) => `${MUSCLE_LABELS[s.muscle]} ${Math.round(s.readiness)}%`).join(', ')}.`
        : ' All muscle groups are fresh.'),
  )

  // Recent workouts + weekly count
  const recent = [...data.workouts].sort((a, b) => b.startedAt - a.startedAt).slice(0, 5)
  if (recent.length > 0) {
    lines.push('Recent workouts:')
    for (const w of recent) {
      lines.push(
        `- ${formatShortDate(w.startedAt)}: ${w.name}, ${w.totalSets} sets, ${Math.round(toDisplayWeight(w.totalVolumeKg, unit))} ${u} volume`,
      )
    }
  } else {
    lines.push('No workouts logged yet.')
  }
  const since = dateKeyDaysAgo(6)
  lines.push(`Workouts in the last 7 days: ${data.workouts.filter((w) => w.dateKey >= since).length}.`)

  // Estimated 1RMs for the featured lifts
  const prs = new Map<string, { name: string; e1rm: number }>()
  for (const w of data.workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) {
        if (!set.completed || set.type === 'warmup') continue
        if (set.weightKg === null || set.reps === null || set.reps === 0) continue
        const e1rm = estimateOneRepMax(set.weightKg, set.reps)
        const current = prs.get(ex.exerciseId)
        if (!current || e1rm > current.e1rm) prs.set(ex.exerciseId, { name: ex.exerciseName, e1rm })
      }
    }
  }
  const featured = FEATURED_LIFTS.map((id) => prs.get(id)).filter(
    (p): p is { name: string; e1rm: number } => Boolean(p),
  )
  if (featured.length > 0) {
    lines.push(
      'Estimated 1RMs: ' +
        featured.map((p) => `${p.name} ${displayW(p.e1rm)} ${u}`).join(', ') +
        '.',
    )
  }

  // Body weight trend
  const weights = [...data.weightEntries].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  const latest = weights.at(-1)
  const first = weights[0]
  if (latest) {
    const delta = first ? latest.weightKg - first.weightKg : 0
    lines.push(
      `Body weight: ${displayW(latest.weightKg)} ${u}` +
        (weights.length > 1
          ? ` (${delta >= 0 ? '+' : ''}${displayW(delta)} ${u} across ${weights.length} weigh-ins).`
          : '.'),
    )
  }

  return lines.join('\n')
}
