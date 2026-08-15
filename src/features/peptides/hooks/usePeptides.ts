import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import type { Peptide, PeptideDoseLog } from '@/types'
import { parseDateKey, todayKey } from '@/utils/date'

/** Doses remaining in stock for a peptide, floored to whole doses. */
export function remainingDoses(peptide: Peptide): number {
  if (peptide.doseMcg <= 0) return 0
  return Math.floor(peptide.inventoryMcg / peptide.doseMcg)
}

/** Low stock = 3 or fewer doses left, but not empty. */
export function isLowStock(peptide: Peptide): boolean {
  const left = remainingDoses(peptide)
  return left > 0 && left <= 3
}

/** Whether a peptide is scheduled on the given date. */
export function isDueOn(peptide: Peptide, date: Date): boolean {
  if (!peptide.active) return false
  if (peptide.frequency === 'daily') return true
  return peptide.daysOfWeek.includes(date.getDay())
}

/** All peptides, active first, then alphabetical. */
export function usePeptides(): Peptide[] {
  const peptides = useDataStore((s) => s.peptides)
  return useMemo(
    () =>
      [...peptides].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    [peptides],
  )
}

export interface ScheduledPeptide {
  peptide: Peptide
  /** True once at least one dose is logged today. */
  logged: boolean
  /** Today's log id, so it can be undone. */
  logId: string | null
  remaining: number
}

export interface TodaySchedule {
  due: ScheduledPeptide[]
  /** Active peptides not scheduled today. */
  offToday: Peptide[]
  completed: number
  total: number
}

/** The dosing plan for today, joined with what's already been logged. */
export function useTodaySchedule(): TodaySchedule {
  const peptides = useDataStore((s) => s.peptides)
  const peptideLogs = useDataStore((s) => s.peptideLogs)

  return useMemo(() => {
    const today = todayKey()
    const now = new Date()
    const todaysLogs = peptideLogs.filter((l) => l.dateKey === today)
    const logByPeptide = new Map<string, PeptideDoseLog>()
    for (const log of todaysLogs) logByPeptide.set(log.peptideId, log)

    const due: ScheduledPeptide[] = []
    const offToday: Peptide[] = []

    for (const peptide of peptides) {
      if (!peptide.active) continue
      if (isDueOn(peptide, now)) {
        const log = logByPeptide.get(peptide.id) ?? null
        due.push({
          peptide,
          logged: log !== null,
          logId: log?.id ?? null,
          remaining: remainingDoses(peptide),
        })
      } else {
        offToday.push(peptide)
      }
    }

    due.sort((a, b) => a.peptide.name.localeCompare(b.peptide.name))
    offToday.sort((a, b) => a.name.localeCompare(b.name))

    return {
      due,
      offToday,
      completed: due.filter((d) => d.logged).length,
      total: due.length,
    }
  }, [peptides, peptideLogs])
}

export interface PeptideHistoryEntry {
  log: PeptideDoseLog
  peptideName: string
}

export interface PeptideHistoryDay {
  dateKey: string
  label: string
  entries: PeptideHistoryEntry[]
}

/** Dose history grouped by day, most recent first. */
export function usePeptideHistory(): PeptideHistoryDay[] {
  const peptides = useDataStore((s) => s.peptides)
  const peptideLogs = useDataStore((s) => s.peptideLogs)

  return useMemo(() => {
    const nameById = new Map(peptides.map((p) => [p.id, p.name]))
    const byDate = new Map<string, PeptideHistoryEntry[]>()

    for (const log of [...peptideLogs].sort((a, b) => b.loggedAt - a.loggedAt)) {
      const entry: PeptideHistoryEntry = {
        log,
        peptideName: nameById.get(log.peptideId) ?? 'Removed peptide',
      }
      const list = byDate.get(log.dateKey)
      if (list) list.push(entry)
      else byDate.set(log.dateKey, [entry])
    }

    const today = todayKey()
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([dateKey, entries]) => ({
        dateKey,
        label:
          dateKey === today
            ? 'Today'
            : parseDateKey(dateKey).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
        entries,
      }))
  }, [peptides, peptideLogs])
}
